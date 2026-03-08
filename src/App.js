import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import './App.css';

// ---------- CONSTANTS ----------
const vehicles = [
  { id: 'innova', name: 'Innova Crysta', rate: 20, capacity: 7 },
  { id: 'suzuki', name: 'Suzuki Ertiga', rate: 17, capacity: 7 },
  { id: 'etios', name: 'Toyota Etios', rate: 15, capacity: 4 },
  { id: 'traveller', name: 'Force Traveller', rate: 35, capacity: 12 },
  { id: 'bus', name: 'Mini Bus', rate: 50, capacity: 20 }
];

const cityList = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune',
  'Goa', 'Jaipur', 'Agra', 'Nashik', 'Pondicherry'
];

// ---------- HELPER FUNCTIONS ----------
const generateBookingId = () => 'DTT' + Math.random().toString(36).substr(2, 9).toUpperCase();

// ---------- MAIN APP ----------
function App() {
  // Google Maps API loader
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyC52EEfOR7rZ43qfdpAiXA0I1W0Ohx-sPA' // ← REPLACE WITH YOUR KEY
  });

  // Tab navigation
  const [activeTab, setActiveTab] = useState('home');

  // Form state
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [tripType, setTripType] = useState('oneway');
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Map-related state
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);
  const [distance, setDistance] = useState(0); // in km
  const [directions, setDirections] = useState(null);
  const [mapError, setMapError] = useState('');

  // Fare calculation
  const [fare, setFare] = useState({ baseFare: 0, taxes: 0, total: 0 });

  // UI controls
  const [showScanner, setShowScanner] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);

  // Bookings
  const [bookings, setBookings] = useState([]);

  // Refs for debouncing
  const geocodeTimeout = useRef(null);

  // Load bookings from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('divyaBookings')) || [];
    setBookings(stored);
  }, []);

  // Recalculate fare when distance, vehicle, or trip type changes
  useEffect(() => {
    if (distance > 0 && selectedVehicle) {
      let base = selectedVehicle.rate * distance;
      if (tripType === 'roundtrip') base *= 1.8;
      const taxes = base * 0.1;
      const total = base + taxes;
      setFare({ baseFare: Math.round(base), taxes: Math.round(taxes), total: Math.round(total) });
    }
  }, [distance, selectedVehicle, tripType]);

  // Geocode an address and return coordinates
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
            const dist = result.routes[0].legs[0].distance.value / 1000; // km
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

  // Debounced geocoding when from/to text changes
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

  // ---------- HANDLERS ----------
  const handleFromChange = (e) => {
    const val = e.target.value;
    setFrom(val);
    if (val.length > 1) {
      const filtered = cityList.filter(c => c.toLowerCase().includes(val.toLowerCase()));
      setFromSuggestions(filtered);
    } else setFromSuggestions([]);
  };

  const handleToChange = (e) => {
    const val = e.target.value;
    setTo(val);
    if (val.length > 1) {
      const filtered = cityList.filter(c => c.toLowerCase().includes(val.toLowerCase()));
      setToSuggestions(filtered);
    } else setToSuggestions([]);
  };

  const selectSuggestion = (field, value) => {
    if (field === 'from') { setFrom(value); setFromSuggestions([]); }
    else { setTo(value); setToSuggestions([]); }
  };

  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const applyPromo = () => {
    if (promoCode === 'SAVE10') setDiscount(10);
    else if (promoCode === 'WELCOME20') setDiscount(20);
    else alert('Invalid promo code');
  };

  // QR Scanner
  const startScanner = () => {
    setShowScanner(true);
    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if (data.from) setFrom(data.from);
          if (data.to) setTo(data.to);
          if (data.date) setJourneyDate(data.date);
        } catch (e) {
          alert('Invalid QR data');
        }
        html5QrCode.stop().then(() => setShowScanner(false));
      },
      (error) => console.warn(error)
    ).catch(err => console.error(err));
  };

  // Payment
  const handlePayment = () => {
    const finalTotal = fare.total - (fare.total * discount) / 100;
    const options = {
      key: 'rzp_test_YOUR_KEY', // ← REPLACE WITH YOUR RAZORPAY TEST KEY
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

  // ---------- RENDER ----------
  return (
    <div className="App">
      {/* Simple Navigation */}
      <nav style={{ padding: '1rem', background: '#667eea', color: 'white', display: 'flex', gap: '2rem' }}>
        <button onClick={() => setActiveTab('home')} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>Home</button>
        <button onClick={() => setActiveTab('mybookings')} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>My Bookings</button>
        <button onClick={() => setActiveTab('admin')} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>Admin</button>
      </nav>

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '1rem' }}>
          <h2>Book Your Vehicle</h2>

          {/* QR Button */}
          <button onClick={startScanner} style={{ marginBottom: '1rem' }}>📷 Scan QR Code</button>

          {/* QR Scanner Modal */}
          {showScanner && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>
                <div id="qr-reader" style={{ width: '300px' }}></div>
                <button onClick={() => setShowScanner(false)}>Close</button>
              </div>
            </div>
          )}

          {/* Form + Map side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Left Column: Form */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Trip Type */}
              <div>
                <label>Trip Type: </label>
                <select value={tripType} onChange={(e) => setTripType(e.target.value)}>
                  <option value="oneway">One Way</option>
                  <option value="roundtrip">Round Trip</option>
                </select>
              </div>

              {/* Dates */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div>
                  <label>Journey Date</label>
                  <input type="date" value={journeyDate} onChange={(e) => setJourneyDate(e.target.value)} />
                </div>
                {tripType === 'roundtrip' && (
                  <div>
                    <label>Return Date</label>
                    <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                  </div>
                )}
              </div>

              {/* From / To with suggestions */}
              <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                <div style={{ flex: 1 }}>
                  <label>From</label>
                  <input type="text" value={from} onChange={handleFromChange} placeholder="Enter city" />
                  {fromSuggestions.length > 0 && (
                    <ul style={{ position: 'absolute', background: 'white', border: '1px solid #ccc', listStyle: 'none', margin: 0, padding: 0, zIndex: 10 }}>
                      {fromSuggestions.map(city => (
                        <li key={city} onClick={() => selectSuggestion('from', city)} style={{ padding: '0.5rem', cursor: 'pointer' }}>{city}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <label>To</label>
                  <input type="text" value={to} onChange={handleToChange} placeholder="Enter city" />
                  {toSuggestions.length > 0 && (
                    <ul style={{ position: 'absolute', background: 'white', border: '1px solid #ccc', listStyle: 'none', margin: 0, padding: 0, zIndex: 10 }}>
                      {toSuggestions.map(city => (
                        <li key={city} onClick={() => selectSuggestion('to', city)} style={{ padding: '0.5rem', cursor: 'pointer' }}>{city}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Vehicle Selection */}
              <div>
                <label>Select Vehicle</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '0.5rem' }}>
                  {vehicles.map(v => (
                    <div key={v.id} onClick={() => setSelectedVehicle(v)} style={{ border: selectedVehicle.id === v.id ? '2px solid blue' : '1px solid #ccc', padding: '1rem', cursor: 'pointer', borderRadius: '4px' }}>
                      <strong>{v.name}</strong><br />₹{v.rate}/km<br />Capacity: {v.capacity}
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Details */}
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <input type="text" name="name" placeholder="Full Name" value={customer.name} onChange={handleCustomerChange} />
                <input type="email" name="email" placeholder="Email" value={customer.email} onChange={handleCustomerChange} />
                <input type="tel" name="phone" placeholder="Phone" value={customer.phone} onChange={handleCustomerChange} />
                <input type="text" name="address" placeholder="Address" value={customer.address} onChange={handleCustomerChange} />
              </div>

              {/* Fare Summary */}
              <div style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '8px' }}>
                <h3>Fare Details</h3>
                <p>Distance: {distance.toFixed(1)} km</p>
                <p>Base Fare: ₹{fare.baseFare}</p>
                <p>GST (10%): ₹{fare.taxes}</p>
                {discount > 0 && <p>Discount ({discount}%): -₹{(fare.total * discount / 100).toFixed(0)}</p>}
                <p><strong>Total: ₹{fare.total - (fare.total * discount / 100)}</strong></p>
              </div>

              {/* Promo Code */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="Promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                <button onClick={applyPromo}>Apply</button>
              </div>

              {/* Pay Button */}
              <button onClick={() => setShowPayment(true)} style={{ background: 'green', color: 'white', padding: '1rem', border: 'none', borderRadius: '4px' }}>Proceed to Pay</button>
            </div>

            {/* Right Column: Map */}
            <div>
              <h3>Route Map</h3>
              {!isLoaded ? (
                <p>Loading map...</p>
              ) : mapError ? (
                <p style={{ color: 'red' }}>{mapError}</p>
              ) : (
                <div style={{ height: '400px', width: '100%' }}>
                  <GoogleMap
                    mapContainerStyle={{ height: '100%', width: '100%' }}
                    center={fromCoords || { lat: 20.5937, lng: 78.9629 }} // default India
                    zoom={5}
                  >
                    {fromCoords && <Marker position={fromCoords} label="A" />}
                    {toCoords && <Marker position={toCoords} label="B" />}
                    {directions && <DirectionsRenderer directions={directions} />}
                  </GoogleMap>
                </div>
              )}
              {distance > 0 && <p style={{ marginTop: '0.5rem' }}><strong>Distance:</strong> {distance.toFixed(1)} km</p>}
            </div>
          </div>

          {/* Payment Modal */}
          {showPayment && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>
                <h3>Confirm Payment</h3>
                <p>Total Amount: ₹{fare.total - (fare.total * discount / 100)}</p>
                <button onClick={handlePayment} style={{ marginRight: '1rem' }}>Pay Now</button>
                <button onClick={() => setShowPayment(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MY BOOKINGS TAB */}
      {activeTab === 'mybookings' && (
        <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
          <h2>My Bookings</h2>
          {bookings.length === 0 ? (
            <p>No bookings yet.</p>
          ) : (
            bookings.map(b => (
              <div key={b.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
                <p><strong>ID:</strong> {b.id}</p>
                <p><strong>Route:</strong> {b.from} → {b.to} ({b.fare.distance.toFixed(1)} km)</p>
                <p><strong>Date:</strong> {b.journeyDate}</p>
                <p><strong>Vehicle:</strong> {b.vehicle.name}</p>
                <p><strong>Total:</strong> ₹{b.fare.finalTotal}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ADMIN TAB */}
      {activeTab === 'admin' && (
        <div style={{ maxWidth: '900px', margin: '2rem auto' }}>
          <h2>Admin Dashboard</h2>
          <h3>All Bookings</h3>
          <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Route</th><th>Date</th><th>Vehicle</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.customer.name}</td>
                  <td>{b.from}→{b.to}</td>
                  <td>{b.journeyDate}</td>
                  <td>{b.vehicle.name}</td>
                  <td>₹{b.fare.finalTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;