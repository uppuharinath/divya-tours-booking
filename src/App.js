import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useJsApiLoader, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import './App.css';
// import './style.css'; // Import your flexbox utility classes

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
    googleMapsApiKey: 'AIzaSyC52EEfOR7rZ43qfdpAiXA0I1W0Ohx-sPA'
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



  // Payment
  const handlePayment = () => {
    const finalTotal = fare.total - (fare.total * discount) / 100;
    const options = {
      key: 'rzp_test_YOUR_KEY',
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
      {/* Enhanced Navigation with shadow and better styling */}
      <nav className="flex justify-between items-center p-4" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="w-50" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🚗 DIVYA TOURS</div>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('home')} 
            style={{ 
              ...tabStyle, 
              borderBottom: activeTab === 'home' ? '3px solid white' : 'none',
              opacity: activeTab === 'home' ? 1 : 0.8
            }}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveTab('mybookings')} 
            style={{ 
              ...tabStyle, 
              borderBottom: activeTab === 'mybookings' ? '3px solid white' : 'none',
              opacity: activeTab === 'mybookings' ? 1 : 0.8
            }}
          >
            My Bookings
          </button>
          <button 
            onClick={() => setActiveTab('admin')} 
            style={{ 
              ...tabStyle, 
              borderBottom: activeTab === 'admin' ? '3px solid white' : 'none',
              opacity: activeTab === 'admin' ? 1 : 0.8
            }}
          >
            Admin
          </button>
        </div>
      </nav>

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <div className="flex-column items-center p-4" style={{ maxWidth: '1200px', margin: '2rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '0.5rem' }}>DIVYA TOURS AND TRAVELS</h1>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>Your Journey, Our Priority</p>
          </div>

          {/* QR Button with better styling */}
        

          {/* QR Scanner Modal */}
          {showScanner && (
            <div className="fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
              <div className="bg-white p-6 rounded-lg" style={{ borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <h3 style={{ marginBottom: '1rem', color: '#333' }}>Scan QR Code</h3>
                <div id="qr-reader" style={{ width: '300px' }}></div>
                <button 
                  onClick={() => setShowScanner(false)} 
                  style={{ ...buttonStyle, marginTop: '1rem', width: '100%', background: '#dc3545' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Form + Map side by side */}
          <div className='row flex jcsa b11'>
            {/* Left Column: Form */}
            <div className="flex-column gap-4 col-12-xsm m-0 col-12-sm col-6-md col-6-ld col-6-xld ">
              {/* Trip Type */}
              <div className="flex jcsa flex-column">
                  <label style={labelStyle}>Trip Type</label>
                <select 
                  value={tripType} 
                  onChange={(e) => setTripType(e.target.value)} 
                 
                  className='w-50 m-auto'
                >
                  <option value="oneway">One Way</option>
                  <option value="roundtrip">Round Trip</option>
                </select>
              </div>

              {/* Dates */}
              <div className="flex mt-1r gap-4">
                <div className="flex-column" style={{ flex: 1 }}>
                  <label style={labelStyle}>Journey Date</label>
                  <input 
                    type="date" 
                    value={journeyDate} 
                    onChange={(e) => setJourneyDate(e.target.value)} 
                  
                    className='fit-content b11 mb-1r'
                  />
                </div>
                {tripType === 'roundtrip' && (
                  <div className="flex-column" style={{ flex: 1 }}>
                    <label style={labelStyle}>Return Date</label>
                    <input 
                      type="date" 
                      value={returnDate} 
                      onChange={(e) => setReturnDate(e.target.value)} 
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              {/* From / To with suggestions */}
              <div className="flex gap-4 relative">
                <div className="flex-1 flex-column">
                  <label style={labelStyle}>From</label>
                  <input 
                    type="text" 
                    value={from} 
                    onChange={handleFromChange} 
                    placeholder="Enter pickup city" 
                   
                    className='w-80 b1'
                  />
                  {fromSuggestions.length > 0 && (
                    <ul style={suggestionListStyle}>
                      {fromSuggestions.map(city => (
                        <li 
                          key={city} 
                          onClick={() => selectSuggestion('from', city)} 
                          style={suggestionItemStyle}
                        >
                          {city}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex-1 flex-column relative">
                  <label style={labelStyle}>To</label>
                  <input 
                    type="text" 
                    value={to} 
                    onChange={handleToChange} 
                    placeholder="Enter destination city" 
                                        className='w-80 b1'

                  />
                  {toSuggestions.length > 0 && (
                    <ul style={suggestionListStyle}>
                      {toSuggestions.map(city => (
                        <li 
                          key={city} 
                          onClick={() => selectSuggestion('to', city)} 
                          style={suggestionItemStyle}
                        >
                          {city}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className="mt-1r p-1r mb-1r  b2 plpr-1r ptpb-1r bg-blue flex-column">
                <label style={labelStyle}>Select Vehicle</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                  gap: '10px' 
                }}>
                  {vehicles.map(v => (
                    <div 
                      key={v.id} 
                      onClick={() => setSelectedVehicle(v)} 
                      style={{
                        ...vehicleCardStyle,
                        border: selectedVehicle.id === v.id ? '3px solid #667eea' : '1px solid #ddd',
                        background: selectedVehicle.id === v.id ? '#f0f4ff' : 'white'
                      }}
                    >
                      <strong style={{ fontSize: '1rem', color: '#333' }}>{v.name}</strong>
                      <span style={{ color: '#667eea', fontWeight: 'bold' }}>₹{v.rate}/km</span>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>👥 {v.capacity} seats</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Details */}
              <div className="flex-column gap-3">
                <label style={labelStyle}>Contact Details</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Full Name" 
                  value={customer.name} 
                  onChange={handleCustomerChange} 
                  style={inputStyle}
                />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email Address" 
                  value={customer.email} 
                  onChange={handleCustomerChange} 
                  style={inputStyle}
                />
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="Phone Number" 
                  value={customer.phone} 
                  onChange={handleCustomerChange} 
                  style={inputStyle}
                />
                <input 
                  type="text" 
                  name="address" 
                  placeholder="Pickup Address" 
                  value={customer.address} 
                  onChange={handleCustomerChange} 
                  style={inputStyle}
                />
              </div>

              {/* Promo Code */}
              <div className="flex gap-2 mt-1r mb-1r">
                <input 
                  type="text" 
                  placeholder="Enter promo code" 
                  value={promoCode} 
                  onChange={(e) => setPromoCode(e.target.value)} 
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button 
                  onClick={applyPromo} 
                  style={{ ...buttonStyle, background: '#28a745', padding: '12px 24px' }}
                >
                  Apply
                </button>
              </div>

              {/* Fare Summary */}
              <div style={fareCardStyle}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#333', borderBottom: '2px solid #667eea', paddingBottom: '0.5rem' }}>
                  Fare Details
                </h3>
                <div style={fareRowStyle}>
                  <span>Distance:</span>
                  <span style={{ fontWeight: 'bold' }}>{distance > 0 ? `${distance.toFixed(1)} km` : 'Not calculated'}</span>
                </div>
                <div style={fareRowStyle}>
                  <span>Base Fare:</span>
                  <span>₹{fare.baseFare}</span>
                </div>
                <div style={fareRowStyle}>
                  <span>GST (10%):</span>
                  <span>₹{fare.taxes}</span>
                </div>
                {discount > 0 && (
                  <div style={{ ...fareRowStyle, color: '#28a745' }}>
                    <span>Discount ({discount}%):</span>
                    <span>-₹{(fare.total * discount / 100).toFixed(0)}</span>
                  </div>
                )}
                <div style={{ 
                  ...fareRowStyle, 
                  borderTop: '2px dashed #ddd', 
                  marginTop: '0.5rem', 
                  paddingTop: '0.5rem',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  <span>Total Amount:</span>
                  <span>₹{fare.total - (fare.total * discount / 100)}</span>
                </div>
              </div>

              {/* Pay Button */}
              <button 
                onClick={() => setShowPayment(true)} 
                style={{
                  ...buttonStyle,
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  padding: '16px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  marginTop: '1rem'
                }}
              >
                Proceed to Pay ₹{fare.total - (fare.total * discount / 100)}
              </button>

                {/* Payment Modal */}
          {showPayment && (
            <div className="w-100 flex jcc aic" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
              <div  className="w-100 fit-content m-auto" style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>Confirm Payment</h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={fareRowStyle}>
                    <span>Base Fare:</span>
                    <span>₹{fare.baseFare}</span>
                  </div>
                  <div style={fareRowStyle}>
                    <span>Taxes:</span>
                    <span>₹{fare.taxes}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ ...fareRowStyle, color: '#28a745' }}>
                      <span>Discount:</span>
                      <span>-₹{(fare.total * discount / 100).toFixed(0)}</span>
                    </div>
                  )}
                  <div style={{ ...fareRowStyle, fontSize: '1.3rem', fontWeight: 'bold', marginTop: '1rem', borderTop: '2px solid #ddd', paddingTop: '1rem' }}>
                    <span>Total:</span>
                    <span>₹{fare.total - (fare.total * discount / 100)}</span>
                  </div>
                </div>
                <div className="flex gap2" style={{ justifyContent: 'space-between' }}>
                  <button 
                    onClick={handlePayment} 
                    style={{ ...buttonStyle, background: '#28a745', flex: 1 }}
                  >
                    Pay Now
                  </button>
                  <button 
                    onClick={() => setShowPayment(false)} 
                    style={{ ...buttonStyle, background: '#dc3545', flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
            </div>

            {/* Right Column: Map */}
            <div className=" col-12-xsm m-0 col-12-sm col-5-md col-5-ld col-5-xld">
              <h3 style={{ color: '#333', marginBottom: '1rem' }}>Route Map</h3>
              {!isLoaded ? (
                <div style={mapPlaceholderStyle}>Loading map...</div>
              ) : mapError ? (
                <div style={{ ...mapPlaceholderStyle, background: '#fff3f3', color: '#dc3545' }}>
                  {mapError}
                </div>
              ) : (
                <div style={{ 
                  height: '500px', 
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <GoogleMap
                    mapContainerStyle={{ height: '100%', width: '100%' }}
                    center={fromCoords || { lat: 20.5937, lng: 78.9629 }}
                    zoom={5}
                    options={{
                      styles: mapStyles,
                      disableDefaultUI: false,
                      zoomControl: true
                    }}
                  >
                    {fromCoords && <Marker position={fromCoords} label="A" />}
                    {toCoords && <Marker position={toCoords} label="B" />}
                    {directions && <DirectionsRenderer directions={directions} />}
                  </GoogleMap>
                </div>
              )}
              {distance > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#e8f4fd',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#0366d6' }}>
                    📍 Total Distance: {distance.toFixed(1)} kilometers
                  </span>
                </div>
              )}
            </div>
          </div>

        
        </div>
      )}

      {/* MY BOOKINGS TAB */}
      {activeTab === 'mybookings' && (
        <div className="flex-column items-center p-4" style={{ maxWidth: '900px', margin: '2rem auto' }}>
          <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '2rem' }}>My Bookings</h1>
          {bookings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: '#f8f9fa',
              borderRadius: '12px',
              color: '#666'
            }}>
              <p style={{ fontSize: '1.2rem' }}>No bookings yet. Start your journey with us!</p>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              {bookings.map(b => (
                <div key={b.id} style={bookingCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ background: '#667eea', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                      {b.id}
                    </span>
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>₹{b.fare.finalTotal}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <span style={bookingLabelStyle}>Route</span>
                      <p style={bookingValueStyle}>{b.from} → {b.to}</p>
                    </div>
                    <div>
                      <span style={bookingLabelStyle}>Journey Date</span>
                      <p className="w-50" style={bookingValueStyle}>{new Date(b.journeyDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span style={bookingLabelStyle}>Vehicle</span>
                      <p style={bookingValueStyle}>{b.vehicle.name}</p>
                    </div>
                    <div>
                      <span style={bookingLabelStyle}>Distance</span>
                      <p style={bookingValueStyle}>{b.fare.distance.toFixed(1)} km</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN TAB */}
      {activeTab === 'admin' && (
        <div className="flex-column items-center p-4" style={{ maxWidth: '1200px', margin: '2rem auto' }}>
          <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '2rem' }}>Admin Dashboard</h1>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            width: '100%',
            overflowX: 'auto'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>All Bookings Overview</h3>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={tableRowStyle}>
                    <td style={tableCellStyle}>{b.id}</td>
                    <td style={tableCellStyle}>
                      <div>{b.customer.name}</div>
                      <small style={{ color: '#666' }}>{b.customer.phone}</small>
                    </td>
                    <td style={tableCellStyle}>{b.from} → {b.to}</td>
                    <td style={tableCellStyle}>{new Date(b.journeyDate).toLocaleDateString()}</td>
                    <td style={tableCellStyle}>{b.vehicle.name}</td>
                    <td style={{ ...tableCellStyle, fontWeight: 'bold', color: '#28a745' }}>₹{b.fare.finalTotal}</td>
                    <td style={tableCellStyle}>
                      <span style={{ background: '#e8f5e9', color: '#28a745', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem' }}>
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No bookings to display</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced styles without modifying CSS file
const tabStyle = {
  background: 'none',
  border: 'none',
  color: 'white',
  fontSize: '1rem',
  padding: '8px 16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const buttonStyle = {
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '1rem',
  padding: '10px 20px',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
};

const inputStyle = {
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '1rem',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.3s ease',
  outline: 'none'
};

const selectStyle = {
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '1rem',
  backgroundColor: 'white',
  cursor: 'pointer',
  outline: 'none',
  flex: 1
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  color: '#555',
  fontWeight: '500',
  fontSize: '0.9rem'
};

const suggestionListStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: 'white',
  border: '1px solid #ddd',
  borderRadius: '8px',
  listStyle: 'none',
  padding: 0,
  margin: '4px 0 0 0',
  zIndex: 10,
  maxHeight: '200px',
  overflowY: 'auto',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

const suggestionItemStyle = {
  padding: '12px',
  cursor: 'pointer',
  borderBottom: '1px solid #f0f0f0',
  transition: 'background-color 0.2s ease'
};

const vehicleCardStyle = {
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  backgroundColor: 'white',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
};

const fareCardStyle = {
  padding: '1.5rem',
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  border: '1px solid #f0f0f0'
};

const fareRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.5rem',
  color: '#555'
};

const mapPlaceholderStyle = {
  height: '400px',
  background: '#f8f9fa',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#666'
};

const bookingCardStyle = {
  background: 'white',
  borderRadius: '12px',
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
  marginBottom: '0.25rem'
};

const bookingValueStyle = {
  fontSize: '1rem',
  fontWeight: '500',
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
  borderBottom: '2px solid #dee2e6'
};

const tableRowStyle = {
  borderBottom: '1px solid #dee2e6',
  transition: 'background-color 0.2s ease'
};

const tableCellStyle = {
  padding: '12px',
  textAlign: 'left'
};

// Map styles for better appearance
const mapStyles = [
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#333333' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f8f9fa' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e9ecef' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#c8e6ff' }]
  }
];

export default App;