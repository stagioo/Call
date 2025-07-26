import { CreateContact } from "./create-contact";
import { CreateTeam } from "./create-team";
import { StartCall } from "./start-call";

const Modals = () => {
  return (
    <>
      <CreateTeam />
      <StartCall />
      <CreateContact />
    </>
  );
};

export default Modals;
