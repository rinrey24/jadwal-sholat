import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

type TabIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
  label: string;
};

function TabIcon({ name, focused, label }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.primary : Colors.ink3}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? Colors.primary : Colors.ink3, fontWeight: focused ? '600' : '400' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom }],
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
        // Let the icon wrapper fill the full item width so our custom
        // label never gets clipped by React Navigation's icon container
        tabBarIconStyle: styles.tabBarIconFill,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} label="Beranda" />
          ),
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} label="Qur'an" />
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} label="Kiblat" />
          ),
        }}
      />
      <Tabs.Screen
        name="dzikir"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'ellipse' : 'ellipse-outline'}
              focused={focused}
              label="Dzikir"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'settings' : 'settings-outline'}
              focused={focused}
              label="Pengaturan"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(252, 251, 247, 0.97)',
    borderTopColor: Colors.line,
    borderTopWidth: 0.5,
    paddingTop: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarItem: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  // Make React Navigation's icon wrapper span the full tab item width
  // so our custom label text is never clipped by its internal size
  tabBarIconFill: {
    width: '100%',
    height: '100%',
  },
  tabItem: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
