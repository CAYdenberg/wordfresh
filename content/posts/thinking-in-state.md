---
title: "Thinking in State: The Tao of Frontend Development"
date_published: "2024-09-23"
---

One of the side effects of working with redux is that it forces you to think about your application in terms of state instead of thinking in terms of user workflow. While state might seem like an implementation detail, with experience it becomes more a part of the design process, allowing us to accurately predict "sad path" situations that may arise when the app is in a particular state.

For example, I once worked on an app that allowed users to perform real-estate searches and then favourite properties. If the user was not logged in at the time they clicked the favourite button/heart, they would be prompted to log in (and then the property would be favourited).

The description of this feature, phrased as user stories, might look like this:

> As a user, I need a favourite button, so that I can keep track of properties that are interesting to me.

> As a visitor (user without an account or not logged in), I need to be prompted to create an account when trying to perform actions that require one, so that I can gain all the benefits of being a user.

This seems simple at first glance. Maybe it would only take a couple of hours to implement, at most. But up until we've neglected to account for the state of the app at the time the favourite is clicked. Obviously, if the property has already been favourited, it can't be favourited again, and (probably) clicking the same button should unfavourite it.

Given-when-thens get us little closer to describing state:

> Given a user is logged in and a property is not favourited, when the user clicks the favourite button, the property should be favourited.

> Given a user is logged in a property is favourited, when the user clicks the favourite button, the property should be unfavourited.

> Given a user is not logged in, when the user clicks the favourite button, the user should be prompted to log in and the property favourited.

Put differently, there are two pieces of information we need to take action: whether the user is logged in, and whether the current property is favourited.

There's also one other cardinal rule of frontend development we should take into account:

**TRUST NO ONE.**

For example, a user might click the favourite button, be prompted to log in and then get annoyed and click away from the modal or whatever we've used to interrupt them. Worse, they might log in to an existing account, and then we might find that they've _already_ favourited the property in question. You can't trust the user.

You also can't trust the network. Knowing whether the user is logged in, whether they've favourited any properties, the act of favouriting/unfavouriting the property, and the act of creating an account/logging in, all require network requests, which take time and can fail. What do we do if the user attempts to favourite a property and completes the registration form only to have the network fail at that point?

Procedurally it might be nightmare to describe all the different paths, but in terms of state it actually becomes manageable. For a task like this I would start by designing the state, which should contain the following items:

```
const isTrue = [1, 2, 3].indexOf(4) === -1;
```

**Note** I use `loadState` fairly ubiquitously with the following convention: 0 - not requested, 1 - loading, 2 - loaded, -1 - error. Representing these values numerically has the advantage that we test things with a simple comparison - ie if we need to know if already have a particular piece of information we test `loadState === 2` if we want to know if we should try to get something we can do `loadState &lt; 1`.

From the description of the state, our "sad-path" cases and their solutions become apparent:

- If `userId === false`, we'll transition `loginModal` to true _instead of_ making any change to the `favourite` of a particular property. We can store the property id somewhere else and dispatch a new action to favourite the property once the login is successful. In fact, using redux, we can store the entire action (since actions are plain objects) to make it flexible enough to handle other types of events that might prompt a login.
- If either `userLoadState` or `favouriteLoadState` is 1 or -1, we probably want to disable the button entirely (since the user doesn't know what action they are really taking). We'd want to show a loading icon or an error message somewhere if that's the case.
- If everything is happy and the user can take action on the particular property, we can go ahead and reverse the value of `favourite` for that property. We'll also set `favouriteLoadState` back to 1, and represent this difference in the UI, say by making the button slightly smaller. This small cue will give reassurance to the user when the button returns to its normal size that the network request was successful.

## Conclusion

By "thinking in state" we've anticipated a number of "sad path" cases and hopefully saved ourselves some headaches down the road. If we sketch out the state needed to handle a particular feature we can do a better job of estimating the time required to implement something - and sometimes even realized that we may need to send things back to design. This insight comes from realizing that all possible states need to be accounted for.
