import ProfileScreen from '../screens/ProfileScreen';

// Add to your tab navigator
<Tab.Screen 
  name="Profile" 
  component={ProfileScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="person" size={size} color={color} />
    ),
  }}
/> 