import { capitalizeFirstLetter } from "@app/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/ui/select";
import { useColorMode } from "@kobalte/core";

export function Theme() {
  const { colorMode, setColorMode } = useColorMode();

  function handleChange(theme: "dark" | "light" | null) {
    if (!theme) {
      return setColorMode("dark");
    }

    setColorMode(theme);
  }

  return (
    <Select
      value={colorMode()}
      onChange={handleChange}
      options={["dark"]}
      defaultValue={"dark"}
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
