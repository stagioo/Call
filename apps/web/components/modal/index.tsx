import { CreateContact } from "./create-contact";
import { CreateTeam } from "./create-team";
import { StartCall } from "./start-call";
import { Thoughts } from "./thoughts";

const Modals = () => {
  return (
    <>
      <CreateTeam />
      <StartCall />
      <CreateContact />
      <Thoughts />
    </>
  );
};

export default Modals;
