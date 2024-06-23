import { Divider } from "@nextui-org/react";

export default function Custom404() {
  return (
    <div className="w-screen h-screen flex justify-center items-center text-lg">
      <h1 className="font-bold text-xl">404</h1>
      <Divider className="w-0.5 h-12 mx-3" orientation="vertical" />
      <div className="text-center leading-4">
        <p className="font-medium">Está página não está disponível.</p>
        <p className="text-base opacity-50">Tipo aquele seu antigo crush.</p>
      </div>
    </div>
  );
}
