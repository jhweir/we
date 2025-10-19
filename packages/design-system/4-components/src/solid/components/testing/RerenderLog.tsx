import { onMount } from 'solid-js';

export interface RerenderLogProps {
  location: string;
}

export function RerenderLog(props: RerenderLogProps) {
  onMount(() => {
    console.log('Re-mounted in: ', props.location);
  });

  return <div style={{ display: 'none' }} />;
}
