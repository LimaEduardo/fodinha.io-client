var socket = io("http://localhost:3000")


socket.on('connect', function () {
  console.log("connected to server")
})

socket.on('listRooms', function(rooms) {
  var roomList = jQuery("#list-rooms");
  roomList.empty()
  rooms.rooms.forEach(element => {
    roomList.append(`<h4>${element.name}</h4>`)
    roomList.append(`<button id='join_room' onclick="joinRoom('${element.name}')" name=${element.name}> Join room </button>`)
  });
})


jQuery('#new-room').on('submit', function(e) {
  e.preventDefault();

  var newRoomName = jQuery('[name=new-room-name]');

  //Make validation for names

  socket.emit('newRoom', {
    name : newRoomName.val()
  }, function (success) {
    if (!success){
      alert("Já exite uma sala com este nome.")
    }
    jQuery("#list-rooms").css("visibility", "hidden");
    jQuery("#new-room").css("visibility", "hidden");
  });
});


function joinRoom(name){
  socket.emit('joinRoom', {name}, function () {
    jQuery("#list-rooms").hide(); 
    jQuery("#new-room").hide(); 
  })
}