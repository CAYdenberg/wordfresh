---
title: "The Banana Index: Interactive"
summary: "Riffing on an idea from The Economist concerning the climate impact of food"
image: "charts/food-impact"
date: "2023-11-27"
---

In April, *The Economist* proposed a [new metric for measuring the climate impact of food](https://www.economist.com/graphic-detail/2023/04/11/a-different-way-to-measure-the-climate-impact-of-food). The motivating factor was that while most plant-based foods are "better" for the environment that most meat-based ones, they also contain fewer calories and less protein, and therefore more of them are needed to make up a full meal or diet.

*The Economist* thus weighted carbon emissions by kilocalorie, gram of protein or gram of fat produced by each kind of food. They then expressed this relative environmental impact in units of bananas - how much :Shortcode{name="CO2"} is emitted per kcal compared to the same ratio for bananas.

Unsurprisingly, beef (and meat in general) produces *a lot* of :Shortcode{name="CO2"} no matter how you slice it. But are carbon emissions the only environmental impact worth considering? When I found the [raw data](https://ourworldindata.org/environmental-impacts-of-food), I discovered that several other impacts had been measured for the same foodstuffs, including land use, water use, and eutrophication (pollution from fertilizer run-off).

My thanks for Agustín Formoso for his [original riff](https://observablehq.com/@aguformoso) and link to the raw data.

::FoodImpact{modelName="food-impact" slug="em-kcal"}

Some of these other impacts don't look as bad for burger-lovers. When looking at :FoodImpactXRef[scarcity-weighted water use]{slug="sww-kcal"}, for example, some types of plant-crops, as well as some kinds of nuts and mushrooms, seem to rank pretty poorly.

