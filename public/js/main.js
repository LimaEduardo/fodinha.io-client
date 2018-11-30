var socket = io("http://localhost:3000")

jQuery("#room").css("visibility", "hidden");
jQuery("#start-match").css("visibility", "hidden");
jQuery('#btn-player-ready').val("false")

var admin = false
var myTurn = false


socket.on('connect', function () {
  console.log("connected to server")
})

socket.on('listRooms', function(rooms) {
  var roomList = jQuery("#list-rooms");
  roomList.empty()
  if (rooms.rooms.length === 0) {
    roomList.append(`<h3 align='center'>Unfortunately no rooms are available </h3>`)
    return
  }
  rooms.rooms.forEach(room => {
    if (!room.inGame){
      // <p>Put the button on the same line as this text. <span class="pull-right">
      // <button type="button" class="btn btn-default btn-small" name="submit" id="submit">+ Add Me</button></span></p>
      roomList.append(`<p>Room: ${room.name} <span class='pull-right'><button type='buttom' class='btn btn-primary btn-small btn-join-room' name='join_room' id='join_room' onclick="joinRoom('${room.name}')" name=${room.name}> Join room </button></span> Players : ${room.players.length} </p>`)
    }
  });
})

socket.on('updatePlayerList', function(players) {
  var ol = jQuery('<ol></ol>');

  players.forEach(function (player) {
    var isReady = 'X'
    if (player.ready){
      isReady = 'V'
    }
    ol.append(jQuery('<li></li>').text(player.name + " " + isReady))
  })

  jQuery('#player_list').html(ol)
})


socket.on('givePlayersCards', function(players) {
  var cards = []
  players.forEach(function (player) {
    if (player.id === socket.id){
      cards = player.cards
      renderCards(cards)
    }
  })
})

socket.on('sendPlayersPoints', function(players) {
  var points = 0;
  players.forEach(function(player){
    if (player.id === socket.id){
      points = player.points;
      x = player.roundsToWin
      renderPoints(points, x)
    }
  })
})

socket.on('startMatchWithCards', function(currentPlayer) {
  if (socket.id === currentPlayer.id){
    jQuery("#player-turn").html(`It's your turn to play!`)
    myTurn = true
  } else {
    jQuery("#player-turn").html(`It's ${currentPlayer.name} turn!`)
    myTurn = false
  }
})

socket.on('changeTurn', function({currentPlayer, players}) {
  console.log("CHANGE")
  console.log(currentPlayer, players)
  if (socket.id === currentPlayer.id){
    jQuery("#player-turn").html(`It's your turn to play!`)
    myTurn = true
  } else {
    jQuery("#player-turn").html(`It's ${currentPlayer.name} turn!`)
    myTurn = false
  }
  players.forEach(function (player) {
    if (player.id === socket.id){
      renderCards(player.cards)
    }
  })
})

socket.on('announceWinner', function({winner}) {
  alert(`${winner.name} won this round!`)
})


jQuery('#new-room').on('submit', function(e) {
  e.preventDefault();

  var playerName = jQuery('#player-name').val()

  if (playerName === ""){
    alert("Player name can't be empty")
    return
  }

  var newRoomName = jQuery('[name=new-room-name]');

  //Make validation for names

  socket.emit('newRoom', {
    name : newRoomName.val(),
    playerName
  }, function (success, room) {
    if (!success){
      alert("A room with this name already exists")
      return
    }
    admin = true
    jQuery("#lobby").css("display", "none");
    renderRoom(newRoomName.val())
    console.log(room)
  });
});

jQuery('#btn-player-ready').on('click', function(e) {
  e.preventDefault();

  var ready = jQuery('#btn-player-ready').val()
  
  ready = ready === "true" ? true : false
  
  socket.emit('playerReady', !ready)
  
  jQuery('#btn-player-ready').val(String(!ready))  
  
  if (!ready){
    jQuery('#btn-player-ready').html("I'm not ready")
  } else {
    jQuery('#btn-player-ready').html("Ready to play")
  }

});


jQuery('#btn-start-match').on('click', function(e) {
  e.preventDefault()

  socket.emit('startMatch')
})

jQuery('#turnsToWin').on('submit', function(e) {
  e.preventDefault();

  var num = jQuery('#rounds').val()

  if (num === ""){
    alert("Player name can't be empty")
    return
  }
  var newRoomName = jQuery('[name=new-room-name]');

  //Make validation for names
  socket.emit('setRoundsToWin', {
    roundsToWin: num
  });
});

function joinRoom(name){
  var playerName = jQuery('#player-name').val()
  if (playerName === ""){
    alert("Player name can't be empty")
    return
  }

  socket.emit('joinRoom', {name,playerName}, function (room) {
    jQuery("#lobby").css("display", "none");
    renderRoom(name)
    console.log(room)
  })
}


function renderRoom(name){
  jQuery("#room").css("visibility", "visible");
  jQuery("#room-title").text(`Room: ${name}`)
  if (admin){
    jQuery("#start-match").css("visibility", "visible");
  }
}

function renderCards(cards){
  var myCards = jQuery('#my-cards')
  var list = jQuery('<div></div>');

  cards.forEach((card) => {
    var pack, color
    if (card.pack === "espadas"){
      pack = '\u2660'
      color = 'black-card'
    } else if (card.pack === "paus")  {
      pack = '\u2663'
      color = 'black-card'
    } else if (card.pack === "ouros"){
      pack = '\u2666'
      color = 'red-card'
    } else {
      pack = '\u2665'
      color = 'red-card'
    }
    list.append(jQuery(`<div id='${card.value + card.pack}' class="card ${color}" onclick='useCard("${card.value}", "${card.pack}", "${card.weight}")'><span>${card.value + " " + pack}</span></div>`))
  })

  myCards.html(list)
}

function renderPoints(points, x) {
  jQuery("#my-points").html(`Points: ${points} I will win ${x}`)
}

function useCard(value, pack, weight){
  if (!myTurn){
    alert("It's not your turn to play.")
    return
  } else {
    socket.emit('playerMove', {value,pack,weight})
  }
}