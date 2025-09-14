import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen({ route, navigation }) {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [placeOfInterest, setPlaceOfInterest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get the location query from navigation params
  const { locationQuery = null, userMessage = "" } = route.params || {};

  useEffect(() => {
    getUserLocation();
    if (locationQuery) {
      searchForPlace(locationQuery);
    }
  }, [locationQuery]);

  const getUserLocation = async () => {
    try {
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your location on the map.');
        setLoading(false);
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
    }
  };

  const searchForPlace = async (query) => {
    try {
      // Use Expo Location geocoding to find the place
      let geocodedLocation = await Location.geocodeAsync(query);
      
      if (geocodedLocation && geocodedLocation.length > 0) {
        const location = geocodedLocation[0];
        setPlaceOfInterest({
          latitude: location.latitude,
          longitude: location.longitude,
          name: query
        });
      } else {
        Alert.alert('Location not found', `Could not find "${query}". Showing your current location instead.`);
      }
    } catch (error) {
      console.error('Error geocoding:', error);
      Alert.alert('Error', 'Could not search for the location. Please try again.');
    }
  };

  const fitToMarkers = () => {
    if (mapRef.current && (userLocation || placeOfInterest)) {
      const markers = [];
      if (userLocation) markers.push(userLocation);
      if (placeOfInterest) markers.push(placeOfInterest);
      
      if (markers.length === 1) {
        // If only one marker, center on it
        mapRef.current.animateToRegion({
          ...markers[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else if (markers.length > 1) {
        // If multiple markers, fit them all
        mapRef.current.fitToCoordinates(markers, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        });
      }
    }
  };

  useEffect(() => {
    if (!loading && (userLocation || placeOfInterest)) {
      // Small delay to ensure map is ready
      setTimeout(fitToMarkers, 500);
    }
  }, [userLocation, placeOfInterest, loading]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 37.78825,
          longitude: userLocation?.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="You are here"
            pinColor="blue"
          />
        )}
        
        {/* Place of Interest Marker */}
        {placeOfInterest && (
          <Marker
          coordinate={{ latitude: 41.8849, longitude: -12.2997 }}
          title="Joe's Shanghai"
          description="This is the location you searched for"
          pinColor="red"
        />
        )}
      </MapView>

      {/* Header with location info */}
      {locationQuery && (
        <View style={styles.header}>
          <Text style={styles.headerText}>Showing: {locationQuery} </Text>
        </View>
      )}

      {/* Back to Chat button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back to Chat</Text>
      </TouchableOpacity>

      {/* Fit to markers button */}
      {(userLocation && placeOfInterest) && (
        <TouchableOpacity 
          style={styles.fitButton}
          onPress={fitToMarkers}
        >
          <Text style={styles.fitButtonText}>Fit to View</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fitButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  fitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});