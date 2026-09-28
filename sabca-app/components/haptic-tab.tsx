import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { useHaptics } from '../hooks/useHaptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { lightImpact } = useHaptics();

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        lightImpact();
        props.onPressIn?.(ev);
      }}
    />
  );
}
