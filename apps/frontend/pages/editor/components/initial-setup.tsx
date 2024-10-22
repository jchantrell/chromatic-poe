import { ChooseDirectory } from "@app/components/choose-dir";

function Setup() {
  return (
    <div class='flex h-full flex-col justify-center items-center'>
      <div class='sm:max-w-[600px] text-center'>
        <div class='text-xl mb-2'>Welcome, exile!</div>
        <div>
          Please select the Path of Exile filter directory on your system.
        </div>
        <ChooseDirectory />
      </div>
    </div>
  );
}

export default Setup;
