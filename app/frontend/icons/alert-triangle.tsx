import { cn } from "@app/lib/utils";

export function AlertTriangleIcon(props: { class?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      stroke-width='2'
      stroke-linecap='round'
      stroke-linejoin='round'
      class={cn("lucide lucide-triangle-alert", props.class)}
    >
      <path d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' />
      <path d='M12 9v4' />
      <path d='M12 17h.01' />
    </svg>
  );
}
