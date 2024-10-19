import { type ConfigColorMode, useColorMode } from "@kobalte/core";
import { capitalizeFirstLetter } from "@pkgs/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pkgs/ui/select";

export function Theme() {
  const { colorMode, setColorMode } = useColorMode();

  function handleChange(theme: ConfigColorMode) {
    if (!theme) {
      return setColorMode("dark");
    }

    setColorMode(theme);
  }

  return (
    <Select
      value={colorMode()}
      onChange={handleChange}
      options={["light", "dark"]}
      defaultValue={colorMode()}
      itemComponent={(props) => (
        <SelectItem item={props.item}>
          {capitalizeFirstLetter(props.item.rawValue)}
        </SelectItem>
      )}
    >
      <SelectTrigger aria-label='theme' class='w-[180px]'>
        <SelectValue<string>>
          {(state) =>
            state.selectedOption()
              ? capitalizeFirstLetter(state.selectedOption())
              : ""
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}
export default Theme;
