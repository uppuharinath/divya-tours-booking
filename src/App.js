import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import './App.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt } from 'react-icons/fa';

// ---------- CONSTANTS WITH STATE NAMES ----------
const cityList = [
  // ... (your full city list, unchanged) ...
  { "name": "Mumbai", "state": "Maharashtra" },
  { "name": "Delhi", "state": "Delhi" },
  { "name": "Bangalore", "state": "Karnataka" },
  { "name": "Bengalure", "state": "Karnataka" },
  { "name": "Chennai", "state": "Tamil Nadu" },
  { "name": "Pune", "state": "Maharashtra" },
  { "name": "Goa", "state": "Goa" },
  { "name": "Jaipur", "state": "Rajasthan" },
  { "name": "Agra", "state": "Uttar Pradesh" },
  { "name": "Nashik", "state": "Maharashtra" },
  { "name": "Pondicherry", "state": "Puducherry" },
  { "name": "Hyderabad", "state": "Telangana" },
  { "name": "Kolkata", "state": "West Bengal" },
  { "name": "Ahmedabad", "state": "Gujarat" },
  { "name": "Lucknow", "state": "Uttar Pradesh" },
  { "name": "Tada", "state": "Andhra Pradesh" },
  { "name": "Nagpur", "state": "Maharashtra" },
  { "name": "Indore", "state": "Madhya Pradesh" },
  { "name": "Bhopal", "state": "Madhya Pradesh" },
  { "name": "Visakhapatnam", "state": "Andhra Pradesh" },
  { "name": "Patna", "state": "Bihar" },
  { "name": "Vadodara", "state": "Gujarat" },
  { "name": "Guwahati", "state": "Assam" },
  { "name": "Chandigarh", "state": "Punjab" },
  { "name": "Thiruvananthapuram", "state": "Kerala" },
  { "name": "Coimbatore", "state": "Tamil Nadu" },
  { "name": "Mysore", "state": "Karnataka" },
  { "name": "Udaipur", "state": "Rajasthan" },
  { "name": "Manali", "state": "Himachal Pradesh" },
  { "name": "Shimla", "state": "Himachal Pradesh" },
  { "name": "Darjeeling", "state": "West Bengal" },
  { "name": "Ooty", "state": "Tamil Nadu" },
  { "name": "Munnar", "state": "Kerala" },
  { "name": "Rishikesh", "state": "Uttarakhand" },
  { "name": "Haridwar", "state": "Uttarakhand" },
  { "name": "Varanasi", "state": "Uttar Pradesh" },
  { "name": "Amritsar", "state": "Punjab" },
  { "name": "Jaisalmer", "state": "Rajasthan" },
  { "name": "Gangtok", "state": "Sikkim" },
  { "name": "Madurai", "state": "Tamil Nadu" },
  { "name": "Kochi", "state": "Kerala" },
  { "name": "Kodaikanal", "state": "Tamil Nadu" },
  { "name": "Coorg", "state": "Karnataka" },
  { "name": "Hampi", "state": "Karnataka" },
  { "name": "Jodhpur", "state": "Rajasthan" },
  { "name": "Mathura", "state": "Uttar Pradesh" },
  { "name": "Vrindavan", "state": "Uttar Pradesh" },
  { "name": "Nainital", "state": "Uttarakhand" },
  { "name": "Mussoorie", "state": "Uttarakhand" },
  { "name": "Mount Abu", "state": "Rajasthan" },
  { "name": "Kullu", "state": "Himachal Pradesh" },
  { "name": "Dharamshala", "state": "Himachal Pradesh" },
  { "name": "Dalhousie", "state": "Himachal Pradesh" },
  { "name": "Kanyakumari", "state": "Tamil Nadu" },
  { "name": "Trichy", "state": "Tamil Nadu" },
  { "name": "Alleppey", "state": "Kerala" },
  { "name": "Lonavala", "state": "Maharashtra" },
  { "name": "Mahabaleshwar", "state": "Maharashtra" },
  { "name": "Aurangabad", "state": "Maharashtra" },
  { "name": "Gwalior", "state": "Madhya Pradesh" },
  { "name": "Jabalpur", "state": "Madhya Pradesh" },
  { "name": "Amravati", "state": "Maharashtra" },
  { "name": "Shirdi", "state": "Maharashtra" },
  { "name": "Srinagar", "state": "Jammu and Kashmir" },
  { "name": "Leh", "state": "Ladakh" },
  { "name": "Shillong", "state": "Meghalaya" },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Bangalore', state: 'Karnataka' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Goa', state: 'Goa' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Agra', state: 'Uttar Pradesh' },
  { name: 'Nashik', state: 'Maharashtra' },
  { name: 'Pondicherry', state: 'Puducherry' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Tada', state: 'Andhra Pradesh' },
  { name: 'Nagpur', state: 'Maharashtra' },
  { name: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Bhopal', state: 'Madhya Pradesh' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Vadodara', state: 'Gujarat' },
  { name: 'Guwahati', state: 'Assam' },
  { name: 'Chandigarh', state: 'Punjab' },
  { name: 'Thiruvananthapuram', state: 'Kerala' },
  { name: 'Coimbatore', state: 'Tamil Nadu' },
  { name: 'Mysore', state: 'Karnataka' },
  { name: 'Udaipur', state: 'Rajasthan' },
  { name: 'Manali', state: 'Himachal Pradesh' },
  { name: 'Shimla', state: 'Himachal Pradesh' },
  { name: 'Darjeeling', state: 'West Bengal' },
  { name: 'Ooty', state: 'Tamil Nadu' },
  { name: 'Munnar', state: 'Kerala' },
  { name: 'Rishikesh', state: 'Uttarakhand' },
  { name: 'Haridwar', state: 'Uttarakhand' },
  { name: 'Varanasi', state: 'Uttar Pradesh' },
  { name: 'Tirupati', state: 'Andhra Pradesh' },
  { name: 'Tirumala', state: 'Andhra Pradesh' },
  { name: 'Alipiri', state: 'Andhra Pradesh' },
  { name: 'Tiruchanur', state: 'Andhra Pradesh' },
  { name: 'Kapila Theertham', state: 'Andhra Pradesh' },
  { name: 'Srikalahasti', state: 'Andhra Pradesh' },
  { name: 'Chandragiri', state: 'Andhra Pradesh' },
  { name: 'Talakona', state: 'Andhra Pradesh' },
  { name: 'Gudimallam', state: 'Andhra Pradesh' },
  { name: 'Nagalapuram', state: 'Andhra Pradesh' },
  { name: 'Kanipakam', state: 'Andhra Pradesh' },
  { name: 'Appalayagunta', state: 'Andhra Pradesh' },
  { name: 'Alleppey', state: 'Kerala' },
  { name: 'Kumarakom', state: 'Kerala' },
  { name: 'Munnar', state: 'Kerala' },
  { name: 'Thekkady', state: 'Kerala' },
  { name: 'Wayanad', state: 'Kerala' },
  { name: 'Kovalam', state: 'Kerala' },
  { name: 'Varkala', state: 'Kerala' },
  { name: 'Bekal', state: 'Kerala' },
  { name: 'Kozhikode', state: 'Kerala' },
  { name: 'Thrissur', state: 'Kerala' },
  { name: 'Marina Beach', state: 'Tamil Nadu' },
  { name: 'Elliots Beach', state: 'Tamil Nadu' },
  { name: 'Mahabalipuram', state: 'Tamil Nadu' },
  { name: 'Kanchipuram', state: 'Tamil Nadu' },
  { name: 'Vellore', state: 'Tamil Nadu' },
  { name: 'Yelagiri', state: 'Tamil Nadu' },
  { name: 'Kolli Hills', state: 'Tamil Nadu' },
  { name: 'Yercaud', state: 'Tamil Nadu' },
  { name: 'Pulicat (TN side)', state: 'Tamil Nadu' },
  { name: 'Nandi Hills', state: 'Karnataka' },
  { name: 'Skandagiri', state: 'Karnataka' },
  { name: 'Bannerghatta', state: 'Karnataka' },
  { name: 'Wonderla Bangalore', state: 'Karnataka' },
  { name: 'Shivanasamudra', state: 'Karnataka' },
  { name: 'Chikmagalur', state: 'Karnataka' },
  { name: 'Sakleshpur', state: 'Karnataka' },
  { name: 'Srirangapatna', state: 'Karnataka' },
  { name: 'Brindavan Gardens', state: 'Karnataka' },
  { name: 'Melukote', state: 'Karnataka' }
];

// Default vehicles (used as fallback or to seed Firestore)
const defaultVehicles = [
  { id: 'innova', name: 'Innova Crysta', rate: 20, capacity: 7 },
  { id: 'suzuki', name: 'Suzuki Ertiga', rate: 17, capacity: 7 },
  { id: 'etios', name: 'Toyota Etios', rate: 15, capacity: 4 },
  { id: 'traveller', name: 'Force Traveller', rate: 35, capacity: 12 },
  { id: 'bus', name: 'Mini Bus', rate: 50, capacity: 20 }
];

// ---------- HELPER FUNCTIONS ----------
const generateBookingId = () => 'DTT' + Math.random().toString(36).substr(2, 9).toUpperCase();

// ---------- MAIN APP ----------
function App() {
  // Google Maps API loader
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyC52EEfOR7rZ43qfdpAiXA0I1W0Ohx-sPA' // Replace with your actual key
  });

  // Tab navigation
  const [activeTab, setActiveTab] = useState('home');

  // ---------- Firebase States ----------
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [vehiclesError, setVehiclesError] = useState('');

  // Admin auth
  const [user, setUser] = useState(null);
  const [adminLoginData, setAdminLoginData] = useState({ email: '', password: '' });
  const [adminLoginError, setAdminLoginError] = useState('');

  // Admin rate editing
  const [tempVehicleRates, setTempVehicleRates] = useState({});
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' });

  // Form state
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [journeyDate, setJourneyDate] = useState(null);
const [returnDate, setReturnDate] = useState(null);
  const [tripType, setTripType] = useState('oneway');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Map-related state
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [distance, setDistance] = useState(0);
  const [directions, setDirections] = useState(null);
  const [mapError, setMapError] = useState('');

  // Fare calculation
  const [fare, setFare] = useState({ baseFare: 0, taxes: 0, total: 0 });

  // UI controls
  const [showScanner, setShowScanner] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);

  // Bookings (localStorage for now)
  const [bookings, setBookings] = useState([]);

  // Refs for debouncing and suggestions
  const geocodeTimeout = useRef(null);
  const fromRef = useRef(null);
  const toRef = useRef(null);

  // ---------- Firebase Real-time Listener for Vehicles ----------
  useEffect(() => {
    setLoadingVehicles(true);
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehiclesData = [];
      snapshot.forEach((doc) => {
        vehiclesData.push({ id: doc.id, ...doc.data() });
      });
      if (vehiclesData.length === 0) {
        // No vehicles in Firestore, seed with defaults
        seedDefaultVehicles();
      } else {
        setVehicles(vehiclesData);
        // Only set selected vehicle if none is selected yet
        setSelectedVehicle(prev => (prev ? prev : vehiclesData[0]));
      }
      setLoadingVehicles(false);
    }, (error) => {
      console.error('Firestore error:', error);
      setVehiclesError('Failed to load vehicle rates. Using defaults.');
      setVehicles(defaultVehicles);
      // Only set default vehicle if none is selected yet
      setSelectedVehicle(prev => (prev ? prev : defaultVehicles[0]));
      setLoadingVehicles(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to seed default vehicles into Firestore
  const seedDefaultVehicles = async () => {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      for (const v of defaultVehicles) {
        await setDoc(doc(vehiclesRef, v.id), {
          name: v.name,
          rate: v.rate,
          capacity: v.capacity
        });
      }
      console.log('Default vehicles seeded');
    } catch (error) {
      console.error('Error seeding vehicles:', error);
    }
  };

  // ---------- Firebase Auth Listener ----------
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  // ---------- Load bookings from localStorage ----------
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('divyaBookings')) || [];
    setBookings(stored);
  }, []);

  // ---------- Fare Calculation ----------
  useEffect(() => {
    if (distance > 0 && selectedVehicle) {
      let base = selectedVehicle.rate * distance;
      if (tripType === 'roundtrip') base *= 1.8;
      const taxes = base * 0.1;
      const total = base + taxes;
      setFare({ baseFare: Math.round(base), taxes: Math.round(taxes), total: Math.round(total) });
    }
  }, [distance, selectedVehicle, tripType]);

  // ---------- Geocoding & Directions ----------
  const geocodeAddress = useCallback((address, type) => {
    if (!window.google || !address) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const coords = { lat: location.lat(), lng: location.lng() };
        if (type === 'from') {
          setFromCoords(coords);
        } else {
          setToCoords(coords);
        }
        setMapError('');
      } else {
        setMapError(`Could not find location: ${address}`);
      }
    });
  }, []);

  // Fetch directions when both coordinates are available
  useEffect(() => {
    if (fromCoords && toCoords && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: fromCoords,
          destination: toCoords,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === 'OK') {
            setDirections(result);
            const dist = result.routes[0].legs[0].distance.value / 1000;
            setDistance(dist);
          } else {
            setMapError('Could not calculate route');
          }
        }
      );
    } else {
      setDirections(null);
    }
  }, [fromCoords, toCoords]);

  // Debounced geocoding
  useEffect(() => {
    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
    if (from) {
      geocodeTimeout.current = setTimeout(() => {
        geocodeAddress(from, 'from');
      }, 800);
    } else {
      setFromCoords(null);
    }
  }, [from, geocodeAddress]);

  useEffect(() => {
    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
    if (to) {
      geocodeTimeout.current = setTimeout(() => {
        geocodeAddress(to, 'to');
      }, 800);
    } else {
      setToCoords(null);
    }
  }, [to, geocodeAddress]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromRef.current && !fromRef.current.contains(event.target)) {
        setFromSuggestions([]);
      }
      if (toRef.current && !toRef.current.contains(event.target)) {
        setToSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---------- HANDLERS ----------
  const handleFromChange = (e) => {
    const val = e.target.value;
    setFrom(val);
    if (val.length > 1) {
      const filtered = cityList.filter(city =>
        city.name.toLowerCase().includes(val.toLowerCase())
      );
      setFromSuggestions(filtered);
    } else {
      setFromSuggestions([]);
    }
  };

  const handleToChange = (e) => {
    const val = e.target.value;
    setTo(val);
    if (val.length > 1) {
      const filtered = cityList.filter(city =>
        city.name.toLowerCase().includes(val.toLowerCase())
      );
      setToSuggestions(filtered);
    } else {
      setToSuggestions([]);
    }
  };

  const selectSuggestion = (field, city) => {
    if (field === 'from') {
      setFrom(city.name);
      setFromSuggestions([]);
      setTimeout(() => {
        if (window.google) geocodeAddress(city.name, 'from');
      }, 100);
    } else {
      setTo(city.name);
      setToSuggestions([]);
      setTimeout(() => {
        if (window.google) geocodeAddress(city.name, 'to');
      }, 100);
    }
  };

  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const applyPromo = () => {
    if (promoCode === 'SAVE10') setDiscount(10);
    else if (promoCode === 'WELCOME20') setDiscount(20);
    else alert('Invalid promo code');
  };

  const swapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
    const tempCoords = fromCoords;
    setFromCoords(toCoords);
    setToCoords(tempCoords);
  };

  // Payment
  const handlePayment = () => {
    const finalTotal = fare.total - (fare.total * discount) / 100;
    const options = {
      key: 'rzp_test_YOUR_KEY', // Replace with your Razorpay test key
      amount: finalTotal * 100,
      currency: 'INR',
      name: 'Divya Tours & Travels',
      description: 'Vehicle Booking',
      handler: (response) => {
        const newBooking = {
          id: generateBookingId(),
          from, to, journeyDate, returnDate, tripType,
          vehicle: selectedVehicle,
          customer,
          fare: { ...fare, finalTotal, distance },
          paymentId: response.razorpay_payment_id,
          date: new Date().toISOString()
        };
        const updatedBookings = [...bookings, newBooking];
        setBookings(updatedBookings);
        localStorage.setItem('divyaBookings', JSON.stringify(updatedBookings));
        alert(`Booking confirmed! ID: ${newBooking.id}`);
        setShowPayment(false);
      },
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone
      }
    };
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  // ---------- ADMIN HANDLERS ----------
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoginError('');
    try {
      await signInWithEmailAndPassword(auth, adminLoginData.email, adminLoginData.password);
    } catch (error) {
      setAdminLoginError(error.message);
    }
  };

  const handleAdminLogout = async () => {
    await signOut(auth);
    setTempVehicleRates({});
  };

  const handleRateChange = (vehicleId, newRate) => {
    setTempVehicleRates({
      ...tempVehicleRates,
      [vehicleId]: parseFloat(newRate) || 0
    });
  };

const saveVehicleRates = async () => {
  console.log('Current user:', auth.currentUser); // ADD THIS
  try {
    const updates = [];
    for (const [id, rate] of Object.entries(tempVehicleRates)) {
      const vehicleRef = doc(db, 'vehicles', id);
      updates.push(updateDoc(vehicleRef, { rate }));
    }
    await Promise.all(updates);
    setTempVehicleRates({});
    setAdminMessage({ type: 'success', text: 'Rates updated successfully!' });
    setTimeout(() => setAdminMessage({ type: '', text: '' }), 3000);
  } catch (error) {
    console.error('Detailed error:', error); // ALSO ADD THIS
    setAdminMessage({ type: 'error', text: 'Failed to update rates: ' + error.message });
  }
};


  // ---------- STYLES ----------
  const navStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem'
  };

  const tabStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1rem',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: 500
  };

  const buttonStyle = {
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '12px 24px',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    fontWeight: 600
  };

  const inputStyle = {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease',
    outline: 'none',
    backgroundColor: 'white'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#555',
    fontWeight: '600',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const vehicleCardStyle = {
    padding: '16px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    fontWeight: 500
  };

  const fareCardStyle = {
    padding: '1.5rem',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0'
  };

  const fareRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
    color: '#555',
    fontSize: '1rem'
  };

  const bookingCardStyle = {
    background: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #f0f0f0',
    transition: 'transform 0.3s ease'
  };

  const bookingLabelStyle = {
    fontSize: '0.85rem',
    color: '#666',
    display: 'block',
    marginBottom: '0.25rem',
    marginTop: '1.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const bookingValueStyle = {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#333',
    margin: 0
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.95rem'
  };

  const tableHeaderStyle = {
    background: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: 600
  };

  const tableRowStyle = {
    borderBottom: '1px solid #dee2e6',
    transition: 'background-color 0.2s ease'
  };

  const tableCellStyle = {
    padding: '12px',
    textAlign: 'left'
  };

  const mapStyles = [
    { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
    { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#c8e6ff' }] }
  ];

  // ---------- RENDER ----------
  return (
    <div className="App">
      {/* Navigation */}
      <nav style={navStyle}>
        <div style={{ letterSpacing: '1px' }}>🚗 DIVYA TOURS</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setActiveTab('home')} style={{ ...tabStyle, borderBottom: activeTab === 'home' ? '3px solid white' : 'none' }}>Home</button>
          <button onClick={() => setActiveTab('mybookings')} style={{ ...tabStyle, borderBottom: activeTab === 'mybookings' ? '3px solid white' : 'none' }}>My Bookings</button>
          <button onClick={() => setActiveTab('admin')} style={{ ...tabStyle, borderBottom: activeTab === 'admin' ? '3px solid white' : 'none' }}>Admin</button>
        </div>
      </nav>

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2.8rem', color: '#333', marginBottom: '0.5rem', fontWeight: 700 }}>DIVYA TOURS AND TRAVELS</h1>
            <p style={{ color: '#666', fontSize: '1.2rem' }}>Your Journey, Our Priority – Safe, Reliable, Comfortable</p>
          </div>

          {/* Loading/Error for vehicles */}
          {loadingVehicles && <div style={{ textAlign: 'center', padding: '1rem' }}>Loading vehicle rates...</div>}
          {vehiclesError && <div style={{ color: '#dc3545', textAlign: 'center', padding: '1rem' }}>{vehiclesError}</div>}

          {/* QR Scanner Modal (unchanged) */}
          {showScanner && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <h3 style={{ marginBottom: '1rem', color: '#333' }}>Scan QR Code</h3>
                <div id="qr-reader" style={{ width: '300px' }}></div>
                <button onClick={() => setShowScanner(false)} style={{ ...buttonStyle, background: '#dc3545', marginTop: '1rem', width: '100%' }}>Close</button>
              </div>
            </div>
          )}

          {/* Form + Map Grid */}
          <div className='container row jcsa'>
            {/* Left Column - Form */}
            <div className="col-11-xsm B11 col-11-sm col-5-md col-5-ld col-5-xld ">

              {/* Trip Type */}
              <div>
                <label style={labelStyle}>Trip Type</label>
                <select value={tripType} onChange={(e) => setTripType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', backgroundColor: 'white' }}>
                  <option value="oneway">One Way</option>
                  <option value="roundtrip">Round Trip</option>
                </select>
              </div>

              {/* Dates */}
<div className="box2 mt-1r" style={{ display: 'flex', gap: '1rem' }}>
  <div style={{ flex: 1, position: 'relative' }}>
    <label style={labelStyle}>Journey Date</label>
    <div style={{ position: 'relative' }}>

      <DatePicker
        selected={journeyDate}
        onChange={(date) => setJourneyDate(date)}
        dateFormat="dd/MM/yyyy"
        minDate={new Date()}
        placeholderText="Select journey date"
        customInput={
          <input
            style={inputStyle}
            readOnly
          />
          
        }
        
        
      />
      <FaCalendarAlt
          style={{
            position: 'relative',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            transform: 'translateX(-90%)',
            color: '#667eea',
            pointerEvents: 'none'
          }}
        />
    </div>
  </div>

  {tripType === 'roundtrip' && (
    <div  style={{ flex: 1, position: 'relative' }}>
      <label style={labelStyle}>Return Date</label>
      <div >
        <DatePicker
          selected={returnDate}
          onChange={(date) => setReturnDate(date)}
          dateFormat="dd/MM/yyyy"
          minDate={journeyDate || new Date()}
          placeholderText="Select return date"
          customInput={
            <input
              style={inputStyle}
              readOnly
            />
          }
        />
        <FaCalendarAlt
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-0%)',
            color: '#667eea',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  )}
</div>

              {/* From / To with Suggestions and Swap Button */}
              <div  className=" box2 mt-1r" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* From Field */}
                <div style={{ flex: 1, position: 'relative' }} ref={fromRef}>
                  <label style={labelStyle}>From</label>
                  <input
                    type="text"
                    value={from}
                    onChange={handleFromChange}
                    placeholder="Enter pickup city"
                    style={inputStyle}
                    autoComplete="off"
                  />
                  {fromSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)', maxHeight: '200px', overflowY: 'auto',
                      zIndex: 9999, marginTop: '4px'
                    }}>
                      {fromSuggestions.map(city => (
                        <div
                          key={city.name}
                          onClick={() => selectSuggestion('from', city)}
                          style={{
                            padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                            fontSize: '1rem', color: '#333', backgroundColor: 'white',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={e => e.target.style.backgroundColor = '#f0f4ff'}
                          onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                        >
                          <span style={{ fontWeight: 500 }}>{city.name}</span>
                          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '8px' }}>{city.state}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Swap Button */}
                <button
                  onClick={swapLocations}
                  style={{
                    background: '#667eea', color: 'white', border: 'none', borderRadius: '50%',
                    width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '24px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}
                  title="Swap From and To"
                >
                  ⇅
                </button>

                {/* To Field */}
                <div style={{ flex: 1, position: 'relative' }} ref={toRef}>
                  <label style={labelStyle}>To</label>
                  <input
                    type="text"
                    value={to}
                    onChange={handleToChange}
                    placeholder="Enter destination city"
                    style={inputStyle}
                    autoComplete="off"
                  />
                  {toSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)', maxHeight: '200px', overflowY: 'auto',
                      zIndex: 9999, marginTop: '4px'
                    }}>
                      {toSuggestions.map(city => (
                        <div
                          key={city.name}
                          onClick={() => selectSuggestion('to', city)}
                          style={{
                            padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                            fontSize: '1rem', color: '#333', backgroundColor: 'white',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={e => e.target.style.backgroundColor = '#f0f4ff'}
                          onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                        >
                          <span style={{ fontWeight: 500 }}>{city.name}</span>
                          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '8px' }}>{city.state}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Selection - using Firebase vehicles */}
              <div className='box2 mt-1r'>
                <label style={labelStyle}>Select Vehicle</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {vehicles.map(v => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      style={{
                        ...vehicleCardStyle,
                        border: selectedVehicle?.id === v.id ? '3px solid #667eea' : '1px solid #ddd',
                        background: selectedVehicle?.id === v.id ? '#f0f4ff' : 'white'
                      }}
                    >
                      <strong style={{ fontSize: '1.1rem', color: '#333' }}>{v.name}</strong>
                      <span style={{ color: '#667eea', fontWeight: 'bold', fontSize: '1.2rem' }}>₹{v.rate}/km</span>
                      <span style={{ fontSize: '0.95rem', color: '#666' }}>👥 {v.capacity} seats</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Details */}
              <div className='box2 mt-1r'>
                <label style={labelStyle}>Contact Details</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input type="text" name="name" placeholder="Full Name" value={customer.name} onChange={handleCustomerChange} style={inputStyle} />
                  <input type="email" name="email" placeholder="Email Address" value={customer.email} onChange={handleCustomerChange} style={inputStyle} />
                  <input type="tel" name="phone" placeholder="Phone Number" value={customer.phone} onChange={handleCustomerChange} style={inputStyle} />
                  <input type="text" name="address" placeholder="Pickup Address" value={customer.address} onChange={handleCustomerChange} style={inputStyle} />
                </div>
              </div>

              {/* Promo Code */}
              <div className="p-1r mt-1r mb-1r" style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="Enter promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={applyPromo} style={{ ...buttonStyle, background: '#28a745', padding: '12px 24px' }}>Apply</button>
              </div>

              {/* Fare Summary */}
              <div style={fareCardStyle}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#333', borderBottom: '2px solid #667eea', paddingBottom: '0.5rem', fontSize: '1.3rem' }}>Fare Details</h3>
                <div style={fareRowStyle}>
                  <span>Distance:</span>
                  <span style={{ fontWeight: 'bold' }}>{distance > 0 ? `${distance.toFixed(1)} km` : '—'}</span>
                </div>
                <div style={fareRowStyle}>
                  <span>Base Fare:</span>
                  <span>₹{fare.baseFare}</span>
                </div>
                <div style={fareRowStyle}>
                  <span>GST (10%):</span>
                  <span>₹{fare.taxes}</span>
                </div>

                <div style={fareRowStyle}>
                  <span>Total:</span>
                  <span> ₹{(Number(fare.baseFare || 0) + Number(fare.taxes || 0)).toLocaleString('en-IN')}</span>
                </div>

                {discount > 0 && (
                  <div style={{ ...fareRowStyle, color: '#28a745' }}>
                    <span>Discount ({discount}%):</span>
                    <span>-₹{(fare.total * discount / 100).toFixed(0)}</span>
                  </div>
                )}
                <div style={{ ...fareRowStyle, borderTop: '2px dashed #ddd', marginTop: '0.5rem', paddingTop: '0.5rem', fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>
                  <span>Total Amount:</span>
                  <span>₹{fare.total - (fare.total * discount / 100)}</span>
                </div>
              </div>

              {/* Pay Button */}
              <button className='mt-1r' onClick={() => setShowPayment(true)} style={{ ...buttonStyle, background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', padding: '16px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                Proceed to Pay ₹{fare.total - (fare.total * discount / 100)}
              </button>
            </div>

            {/* Right Column - Map */}
            <div className="col-11-xsm col-11-sm col-6-md col-6-ld col-6-xld ">
              <h3 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.3rem' }}>Route Map</h3>
              {!isLoaded ? (
                <div style={{ height: '450px', background: '#f8f9fa', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Loading map...</div>
              ) : mapError ? (
                <div style={{ height: '450px', background: '#fff3f3', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc3545' }}>{mapError}</div>
              ) : (
                <div style={{ height: '450px', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <GoogleMap
                    mapContainerStyle={{ height: '100%', width: '100%' }}
                    center={fromCoords || { lat: 20.5937, lng: 78.9629 }}
                    zoom={5}
                    options={{ styles: mapStyles, disableDefaultUI: false, zoomControl: true }}
                  >
                    {fromCoords && <Marker position={fromCoords} label="A" />}
                    {toCoords && <Marker position={toCoords} label="B" />}
                    {directions && <DirectionsRenderer directions={directions} />}
                  </GoogleMap>
                </div>
              )}
              {distance > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#e8f4fd', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#0366d6' }}>📍 Total Distance: {distance.toFixed(1)} km</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Modal */}
          {showPayment && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxWidth: '400px', width: '90%' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#333', fontSize: '1.5rem' }}>Confirm Payment</h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={fareRowStyle}><span>Base Fare:</span><span>₹{fare.baseFare}</span></div>
                  <div style={fareRowStyle}><span>Taxes:</span><span>₹{fare.taxes}</span></div>
                  {discount > 0 && <div style={{ ...fareRowStyle, color: '#28a745' }}><span>Discount:</span><span>-₹{(fare.total * discount / 100).toFixed(0)}</span></div>}
                  <div style={{ ...fareRowStyle, fontSize: '1.3rem', fontWeight: 'bold', marginTop: '1rem', borderTop: '2px solid #ddd', paddingTop: '1rem' }}>
                    <span>Total:</span><span>₹{fare.total - (fare.total * discount / 100)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={handlePayment} style={{ ...buttonStyle, background: '#28a745', flex: 1 }}>Pay Now</button>
                  <button onClick={() => setShowPayment(false)} style={{ ...buttonStyle, background: '#dc3545', flex: 1 }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MY BOOKINGS TAB */}
      {activeTab === 'mybookings' && (
        <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '1rem' }}>
          <h1 style={{ fontSize: '2.2rem', color: '#333', marginBottom: '2rem', fontWeight: 700 }}>Bookings</h1>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f9fa', borderRadius: '16px', color: '#666' }}>
              <p style={{ fontSize: '1.2rem' }}>No bookings yet. Start your journey with us!</p>
            </div>
          ) : (
            bookings.map(b => (
              <div key={b.id} style={bookingCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ background: '#667eea', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>{b.id}</span>
                  <span style={{ color: '#28a745', fontWeight: 'bold', fontSize: '1.2rem' }}>₹{b.fare.finalTotal}</span>
                </div>
                <div >
                  <div className='mt-1r'><span style={bookingLabelStyle}>Route.</span><p style={bookingValueStyle}>{b.from} → {b.to}</p></div>
                  <div className='mt-1r'><span style={bookingLabelStyle}>Journey Date</span>
                  <p style={bookingValueStyle}>{new Date(b.journeyDate).toLocaleDateString()}</p></div>
                  <div className='mt-1r'><span style={bookingLabelStyle}>Vehicle</span><p style={bookingValueStyle}>{b.vehicle.name}</p></div>
                  <div className='mt-1r'><span style={bookingLabelStyle}>Distance</span><p style={bookingValueStyle}>{b.fare.distance.toFixed(1)} km</p></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ADMIN TAB */}
      {activeTab === 'admin' && (
        <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '1rem' }}>
          {!user ? (
            // Admin Login Form
            <div style={{
              maxWidth: '400px',
              margin: '0 auto',
              padding: '2rem',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '2rem' }}>Admin Login</h2>
              <form onSubmit={handleAdminLogin}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={adminLoginData.email}
                    onChange={(e) => setAdminLoginData({ ...adminLoginData, email: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Password</label>
                  <input
                    type="password"
                    value={adminLoginData.password}
                    onChange={(e) => setAdminLoginData({ ...adminLoginData, password: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                {adminLoginError && (
                  <div style={{ color: '#dc3545', marginBottom: '1rem', textAlign: 'center' }}>
                    {adminLoginError}
                  </div>
                )}
                <button
                  type="submit"
                  style={{
                    ...buttonStyle,
                    background: '#667eea',
                    width: '100%',
                    padding: '14px'
                  }}
                >
                  Login
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                Use Firebase Auth admin credentials
              </p>
            </div>
          ) : (
            // Admin Dashboard
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.2rem', color: '#333', fontWeight: 700 }}>Admin Dashboard</h1>
                <button
                  onClick={handleAdminLogout}
                  style={{ ...buttonStyle, background: '#dc3545' }}
                >
                  Logout
                </button>
              </div>

              {adminMessage.text && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderRadius: '8px',
                  backgroundColor: adminMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                  color: adminMessage.type === 'success' ? '#155724' : '#721c24',
                  border: `1px solid ${adminMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                  {adminMessage.text}
                </div>
              )}

              {/* Live Rate Management */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Live Rate Management</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Vehicle</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Capacity</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Current Rate (₹/km)</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>New Rate (₹/km)</th>
                      </tr>
                    </thead>
                    <thead>
                      {vehicles.map(vehicle => (
                        <tr key={vehicle.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '12px', fontWeight: 500 }}>{vehicle.name}</td>
                          <td style={{ padding: '12px' }}>{vehicle.capacity} seats</td>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#667eea' }}>₹{vehicle.rate}</td>
                          <td style={{ padding: '12px' }}>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={tempVehicleRates[vehicle.id] !== undefined ? tempVehicleRates[vehicle.id] : ''}
                              onChange={(e) => handleRateChange(vehicle.id, e.target.value)}
                              placeholder="Enter new rate"
                              style={{
                                ...inputStyle,
                                padding: '8px',
                                width: '120px'
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </thead>
                  </table>
                </div>
                <button
                  onClick={saveVehicleRates}
                  style={{
                    ...buttonStyle,
                    background: '#28a745',
                    marginTop: '1.5rem'
                  }}
                  disabled={Object.keys(tempVehicleRates).length === 0}
                >
                  Save Rate Changes
                </button>
              </div>

              {/* Bookings Overview */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>All Bookings Overview</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={tableHeaderStyle}>
                        <th style={tableCellStyle}>Booking ID</th>
                        <th style={tableCellStyle}>Customer</th>
                        <th style={tableCellStyle}>Route</th>
                        <th style={tableCellStyle}>Date</th>
                        <th style={tableCellStyle}>Vehicle</th>
                        <th style={tableCellStyle}>Amount</th>
                        <th style={tableCellStyle}>Status</th>
                      </tr>
                    </thead>
                    <thead>
                      {bookings.map(b => (
                        <tr key={b.id} style={tableRowStyle}>
                          <td style={tableCellStyle}>{b.id}</td>
                          <td style={tableCellStyle}><div>{b.customer.name}</div><small style={{ color: '#666' }}>{b.customer.phone}</small></td>
                          <td style={tableCellStyle}>{b.from} → {b.to}</td>
                          <td style={tableCellStyle}>{new Date(b.journeyDate).toLocaleDateString()}</td>
                          <td style={tableCellStyle}>{b.vehicle.name}</td>
                          <td style={{ ...tableCellStyle, fontWeight: 'bold', color: '#28a745' }}>₹{b.fare.finalTotal}</td>
                          <td style={tableCellStyle}><span style={{ background: '#e8f5e9', color: '#28a745', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>Confirmed</span></td>
                        </tr>
                      ))}
                    </thead>
                  </table>
                </div>
                {bookings.length === 0 && <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No bookings to display</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;