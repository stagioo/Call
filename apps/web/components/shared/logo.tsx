import { Icons } from "@call/ui/components/icons";

const Logo = () => {
  return (
    <h1 className="text-2xl font-bold flex items-center gap-2">
      <Icons.logoDark className="size-6 block dark:hidden" />
      <Icons.logo className="size-6 hidden dark:block" />
      <span className="text-primary font-lora">Call</span>
    </h1>
  );
};

export default Logo;
