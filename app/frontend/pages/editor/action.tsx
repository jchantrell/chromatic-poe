import { TextField, TextFieldLabel } from "@app/ui/text-field";

function StylePicker() {
  return (
    <div class='gap-2 border border-muted flex'>
      <TextField class='grid grid-cols-4 items-center gap-4'>
        <TextFieldLabel class='text-right'>Text</TextFieldLabel>
        <input type='color' id='text' name='text' value='#e66465' />
      </TextField>
      <TextField class='grid grid-cols-4 items-center gap-4'>
        <TextFieldLabel class='text-right'>Border</TextFieldLabel>
        <div>
          <input type='color' id='border' name='border' value='#e66465' />
        </div>
      </TextField>
      <TextField class='grid grid-cols-4 items-center gap-4'>
        <TextFieldLabel class='text-right'>Background</TextFieldLabel>
        <input type='color' id='background' name='background' value='#e66465' />
      </TextField>
    </div>
  );
}

export default StylePicker;
