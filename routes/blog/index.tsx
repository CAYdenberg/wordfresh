import { PageProps } from "$fresh/server.ts";
import { postHandler, PostHandlerData } from "../../src/models/Post.ts";

export const handler = postHandler;

export default function PostIndex({ data }: PageProps<PostHandlerData>) {
  return (
    <div>
      <ul>
        {data.posts.map((post) => (
          <li key={post.slug}>{post.title} - {post.slug}</li>
        ))}
      </ul>
      <p>Page {data.pagination.page} of {data.pagination.summary.to}</p>
    </div>
  );
}
