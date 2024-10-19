interface Props {
  myProp: string;
}

export default function Block(props: Props) {
  return (
    <div
      style={{ background: "red", color: "white", height: 400 }}
    >
      {props.myProp}
    </div>
  );
}
