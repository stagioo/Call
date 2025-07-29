import { AddMemberToTeam } from "./add-member-to-team";
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
      <AddMemberToTeam />
    </>
  );
};

export default Modals;
