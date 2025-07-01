let rooms = [
  { number: 101, type: "Single", price: 1200, available: true },
  { number: 102, type: "Double", price: 2000, available: true },
  { number: 103, type: "Suite", price: 3500, available: true },
];

let selectedRoom = null;

window.onload = () => {
  renderRooms();
  showMyBookings();
  showAdminRoomList();
};

function renderRooms() {
  const container = document.getElementById('roomList');
  container.innerHTML = '';
  rooms.forEach(room => {
    const div = document.createElement('div');
    div.className = 'room';
    div.innerHTML = `
      <h3>Room ${room.number} - ${room.type}</h3>
      <p>Price: ₹${room.price}</p>
      <p>Status: ${room.available ? '✅ Available' : '❌ Booked'}</p>
      ${room.available ? `<button onclick="showBooking(${room.number})">Book Now</button>` : ''}
    `;
    container.appendChild(div);
  });
}

function showBooking(roomNo) {
  selectedRoom = rooms.find(r => r.number === roomNo);
  document.getElementById('selectedRoom').textContent = `#${roomNo}`;
  document.getElementById('bookingForm').classList.remove('hidden');
}

function confirmBooking() {
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  if (!checkIn || !checkOut) return alert("Enter valid dates.");

  const days = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
  if (days <= 0) return alert("Check-out must be after check-in.");

  const cost = days * selectedRoom.price;
  alert(`Booking Confirmed! Total: ₹${cost}`);

  selectedRoom.available = false;
  saveBooking({ room: selectedRoom.number, checkIn, checkOut });
  renderRooms();
  showMyBookings();
  document.getElementById('bookingForm').classList.add('hidden');
}

function saveBooking(booking) {
  const bookings = JSON.parse(localStorage.getItem('bookings') || "[]");
  bookings.push(booking);
  localStorage.setItem('bookings', JSON.stringify(bookings));
}

function showMyBookings() {
  const list = document.getElementById('bookingList');
  const bookings = JSON.parse(localStorage.getItem('bookings') || "[]");
  list.innerHTML = '';
  bookings.forEach(b => {
    const li = document.createElement('li');
    li.textContent = `Room ${b.room} | ${b.checkIn} - ${b.checkOut}`;
    list.appendChild(li);
  });
}

function addRoom() {
  const no = parseInt(document.getElementById("newRoomNo").value);
  const type = document.getElementById("newRoomType").value;
  const price = parseFloat(document.getElementById("newRoomPrice").value);
  if (!no || !type || !price) return alert("All fields required.");

  if (rooms.find(r => r.number === no)) return alert("Room already exists!");

  rooms.push({ number: no, type, price, available: true });
  renderRooms();
  showAdminRoomList();
}

function showAdminRoomList() {
  const ul = document.getElementById("adminRoomList");
  ul.innerHTML = "";
  rooms.forEach((r, index) => {
    const li = document.createElement("li");
    li.innerHTML = `Room ${r.number} - ${r.type} - ₹${r.price} 
      <button onclick="removeRoom(${index})">❌</button>`;
    ul.appendChild(li);
  });
}

function removeRoom(index) {
  if (confirm("Delete this room?")) {
    rooms.splice(index, 1);
    renderRooms();
    showAdminRoomList();
  }
}

function downloadReceipt() {
  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  let content = `<h1>Hotel Booking Receipt</h1><ul>`;
  bookings.forEach(b => {
    const room = rooms.find(r => r.number === b.room);
    const days = (new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24);
    const cost = room.price * days;
    content += `<li>Room ${b.room}: ₹${room.price} × ${days} nights = ₹${cost}</li>`;
  });
  content += "</ul>";

  const receipt = document.createElement("div");
  receipt.innerHTML = content;
  html2pdf().from(receipt).save("Hotel_Receipt.pdf");
}
