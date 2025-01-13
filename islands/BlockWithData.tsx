import type { FunctionComponent } from "preact";
import type { WfGetQueryResolved } from "src";
import type { TySpeakingSchema } from "../models/Speaking.ts";

interface Props {
  myData: WfGetQueryResolved<TySpeakingSchema>;
}

const BlockWithData: FunctionComponent<Props> = (
  props,
) => {
  const { myData } = props;
  if (!myData.data) return <h2>Unable to retrieve talks</h2>;
  return (
    <ul>
      {myData.data?.map((talk) => <li key={talk.slug}>{talk.title}</li>)}
    </ul>
  );
};

export default BlockWithData;
