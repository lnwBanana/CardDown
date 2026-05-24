import GachaScreen from "./GachaScreen";

export default function Preview() {
  return (
    <GachaScreen
      collection={{}}
      normalTrashCube={50}
      goldTrashCube={20}
      onCurrencyChange={(n, g) => {
        console.log("currency:", n, g);
      }}
      onAddToCollection={(cards) => {
        console.log("cards:", cards);
      }}
      onBack={() => alert("back")}
    />
  );
}