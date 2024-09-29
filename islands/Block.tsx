interface Props {
  myProp: string;
}

export default function Block({ myProp }: Props) {
  return (
    <div
      style={{ background: "red", color: "white", height: 400 }}
    >
      {myProp}
    </div>
  );
}
