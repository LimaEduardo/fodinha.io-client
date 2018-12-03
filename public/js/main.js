var socket = io("http://localhost:3000")
//Quando der deploy, tem que comentar a linha de cima e descomentar a de baixo.
// var socket = io("http://server-fodinha.herokuapp.com/")

jQuery("#room").css("visibility", "hidden");
jQuery("#start-match").css("visibility", "hidden");
jQuery('#btn-player-ready').val("false")

var admin = false
var myTurn = false
var hand = 1
var observer = false


socket.on('connect', function () {
  console.log("connected to server")
})

socket.on('listRooms', function(rooms) {
  var roomList = jQuery("#list-rooms");
  roomList.empty()
  if (rooms.rooms.length === 0) {
    roomList.append(`<h3 align='center'>Unfortunately there are no rooms available </h3>`)
    return
  }
  rooms.rooms.forEach(room => {
    if (!room.inGame){
      roomList.append(`<p>Room: ${room.name} <span class='pull-right'><button type='buttom' class='btn btn-primary btn-small btn-join-room' name='join_room' id='join_room' onclick="joinRoom('${room.name}')" name=${room.name}> Join room </button><button type='buttom' class='btn btn-primary btn-small btn-join-room' name='watch-room' id='watch_room' onclick="watchRoom('${room.name}')" name="${room.name}-watch"> Watch room </button></span> Players : ${room.players.length} </p>`)
    }
  });
})

socket.on('updatePlayerList', function(players) {
  var div = jQuery("#player-list");
  div.empty()
  players.forEach(function (player) {
    var isReady = 'Not ready'
    var readyClass = 'not-ready'
    var currentPoints = player.totalPoints
    var pointsTODO = player.pointsToDo
    if (player.ready){
      isReady = 'Ready'
      var readyClass = 'ready'
    }
    div.append(jQuery(`<div id="${player.name}-cards" class="player-card row"><div class="col-sm-3"><h5>Name: ${player.name}</h5> <h6> ${isReady} </h6> <h6 id=${player.name}-points>Total points: ${currentPoints}</h6> <h6 id=${player.name}-toDoPoints>Points to do: ${pointsTODO}</h6></div><div class="col-sm-9"> <h6>Cards:</h6> <div id="cards-${player.name}" class="cards-container"></div> </div></div>`))
    jQuery(`#${player.name}-cards`).addClass(readyClass)
    // renderCards(player, player.cards, players)
  })
  // jQuery('#player_list').html(ol)
})

socket.on('updatePlayerPoints', function(players) {
  players.forEach(function (player) {
    jQuery(`#${player.name}-points`).html(`Total points: ${player.totalPoints}`)
    jQuery(`#${player.name}-toDoPoints`).html(`Points to do: ${player.pointsToDo}`)
  })
})

socket.on('givePlayersCards', function(players) {
  jQuery("#table").empty()
  jQuery("#table").append(`<h6> Hand: ${hand} </h6> <di class='black-space-motherfucker'v></div>`)
  clearButtons()
  var cards = []
  players.forEach(function (player) {
    if (player.id === socket.id){
      cards = player.cards
      renderCards(player,cards, players)
    }
  })

  if (observer === true){
    renderCardsObserver(players)
  }
})

socket.on('sendPlayersPoints', function(players) {
  var points = 0;
  players.forEach(function(player){
    if (player.id === socket.id){
      points = player.points;
      renderPoints(points)
    }
  })
})

socket.on('startMatchWithCards', function(currentPlayer) {
  hand = 1
  if (socket.id === currentPlayer.id){
    jQuery("#player-turn").html(`It's your turn to play!`)
    myTurn = true
  } else {
    jQuery("#player-turn").html(`It's ${currentPlayer.name} turn!`)
    myTurn = false
  }

  jQuery(`#${currentPlayer.name}-cards`).removeClass("ready")
  jQuery(`#${currentPlayer.name}-cards`).addClass("player-current-turn").removeClass("player-card")
  jQuery("#table").empty()
  jQuery("#table").append(`<h6> Hand: ${hand} </h6> <di class='black-space-motherfucker'v></div>`)
})

socket.on('changeTurn', function({currentPlayer, players}) {
  if (socket.id === currentPlayer.id){
    jQuery("#player-turn").html(`It's your turn to play!`)
    myTurn = true
  } else {
    jQuery("#player-turn").html(`It's ${currentPlayer.name} turn!`)
    myTurn = false
  }
  players.forEach(function (player) {
    if (player.id === socket.id){
      renderCards(player,player.cards, players)
    }
    if (player.name === currentPlayer.name){
      jQuery(`#${player.name}-cards`).addClass("player-current-turn").removeClass("player-card")
    } else {
      jQuery(`#${player.name}-cards`).removeClass("player-current-turn").addClass("player-card")
    }
  })
  if (observer === true){
    renderCardsObserver(players)
  }
})

socket.on('announceWinner', function({winner}) {
  if (winner === "draw"){
    alert(`This round ended in a draw`)
  } else if (winner.id === socket.id) {
    alert(`You won this round!`)
  } else {
    alert(`${winner.name} won this round!`)
  }
  
  hand += 1
  jQuery("#table").append("<div class='blank-space-motherfucker'></div>")
  jQuery("#table").append(`<h6> Hand: ${hand} </h6> <di class='black-space-motherfucker'v></div>`)
  jQuery("#rounds").prop('disabled', false)
})

socket.on('endMatch', function(player) {
  if (player === null){
    alert(`The match has ended! We don't have any winner`)
  } else {
    alert(`The match has ended! The winner is ${player.name}`)
  }
})

socket.on('cardPlayed', function ({card, playerName}) {
  var table = jQuery("#table")
  
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
  table.append(jQuery(`<div class="container-card-static"><div class="card-static ${color}" ><span align='center'>${card.value + " " + pack}</span></div><p align="center">${playerName}</p></div>`))
})

socket.on('playersNotReady', function() {
  if (admin === true){
    alert("All players must be ready to start a match")
  }
})

socket.on('playersNotSetPointsTODO', function({id}) {  
  alert('All players must has set points to do')
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
    alert("number of rounds is empty")
    return
  }

  socket.emit('setRoundsToWin', {
    roundsToWin: num
  });
  jQuery("#rounds").prop('disabled', true)
})


function joinRoom(name){
  var playerName = jQuery('#player-name').val()
  if (playerName === ""){
    alert("Player name can't be empty")
    return
  }

  socket.emit('joinRoom', {name,playerName}, function (room) {
    jQuery("#lobby").css("display", "none");
    renderRoom(name)
  })
}

function watchRoom(name){
  var playerName = jQuery('#player-name').val()
  if (playerName === ""){
    alert("Player name can't be empty")
    return
  }

  socket.emit('watchRoom', {name}, function () {
    jQuery("#lobby").css("display", "none");
    renderRoom(name)
    observer = true
  })

  jQuery("#btn-player-ready").css("display", "none")
  jQuery("#turnsToWin").css("display", "none")
}

function renderRoom(name){
  jQuery("#room").css("visibility", "visible");
  jQuery("#room-title").text(`Room: ${name}`)
  if (admin){
    jQuery("#start-match").css("visibility", "visible");
  }
}

function renderCards(player,cards, players){
  console.log(player, cards, players)
  var myCards = jQuery(`#cards-${player.name}`)

  myCards.empty()

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
    myCards.append(jQuery(`<div id='${card.value + card.pack}' class="card ${color}" onclick='useCard("${card.value}", "${card.pack}", "${card.weight}")'><span align='center'>${card.value + " " + pack}</span></div>`))
  
  })

  players.forEach((individual) => {
    if (player.name === individual.name){
      return
    } else {
      var individualCards = jQuery(`#cards-${individual.name}`)
      individualCards.empty()
      individual.cards.forEach((card) => {
        individualCards.append(jQuery(`<div class="card"><img src="../assets/back-card.png" alt="Opponent Card" height="100px" width="60px"></div>`))
      })
    }
  })
}

function renderCardsObserver(players){
  players.forEach((individual) => {
    var individualCards = jQuery(`#cards-${individual.name}`)
    individualCards.empty()
    individual.cards.forEach((card) => {
      individualCards.append(jQuery(`<div class="card"><img src="../assets/back-card.png" alt="Opponent Card" height="100px" width="60px"></div>`))
    })
  })
}


function useCard(value, pack, weight){
  if (!myTurn){
    alert("It's not your turn to play.")
    return
  } else {
    socket.emit('playerMove', {value,pack,weight})
  }
}

function clearButtons(){
  jQuery("#player-ready").css("display", "none")
  jQuery("#start-match").css("display", "none")
}
