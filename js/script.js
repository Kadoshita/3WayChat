navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var peer = new Peer({
	key: '6e837f61-b5f8-4a01-aae5-bb21c54ca930',
	debug: 3
});
var roomname='';
var room;
var localStream=null;
peer.on('error', function(err){
	alert(err.message);
});

init();

function init () {
	$('#init').show();
	$('#select').hide();
	$('#chat').hide();

	$('#enter-button').click(function() {
		console.log(MODE);
		roomname=$('#room-name').val();
		if(!roomname){
			return;
		}
		console.log(roomname);
		select();
	});
}
function select () {
	$('#select').show();
	$('#init').hide();
	$('#chat').hide();

	switch (MODE) {
		case 1:
			$('#speed-message').append('あなたの環境では、ビデオ+テキストチャットをお勧めします。');
			break;
		case 2:
			$('#speed-message').append('あなたの環境では、スナップショット+音声+テキストチャットをお勧めします。');
			break;
		case 3:
			$('#speed-message').append('あなたの環境では、テキストチャットのみをお勧めします。');
			break;
		default:
			$('#speed-message').append('ERROR');
			break;
	}

	$('#high').click(function() {
		MODE=1;
		chat();
		return;
	});
	$('#mid').click(function() {
		MODE=2;
		chat();
		return;
	});
	$('#low').click(function() {
		MODE=0;
		chat();
		return;
	});
}
function chat () {
	$('#chat').show();
	$('#init').hide();
	$('#select').hide();
	if(MODE===1){
		navigator.mediaDevices.getUserMedia({video: true, audio: true})
		.then(function (stream){
			localStream=stream;
			$('#my-video').prop('src', URL.createObjectURL(stream));

			room=peer.joinRoom('3waychat_'+roomname,{mode:'sfu',stream:localStream});
			RoomManager(room);
		}).catch(function (error){
			console.error(error);
			sweetAlert('ERROR!!', 'please reload this page', 'error');
			return;
		});
	}
	else if(MODE===2){
		navigator.mediaDevices.getUserMedia({video: false, audio: true})
		.then(function (stream){
			localStream=stream;
			var roomname=$('#room-name').val();
			if(!roomname){
				return;
			}
			console.log(roomname);

			room=peer.joinRoom('3waychat_'+roomname,{mode:'sfu',stream:localStream});
			RoomManager(room);
		}).catch(function (error){
			console.error(error);
			sweetAlert('ERROR!!', 'please reload this page', 'error');
			return;
		});

		navigator.mediaDevices.getUserMedia({video: true, audio: false})
		.then(function (stream){
			console.log(URL.createObjectURL(stream));
			$('#tmp-video').prop('src', URL.createObjectURL(stream));
			var canvas=document.getElementById('my-canvas');
			var tmpVideo=document.getElementById('tmp-video');
			setInterval(function () {
				if(room!=null){
					var ctx = canvas.getContext('2d');
					ctx.drawImage(tmpVideo, 0, 0, canvas.width, canvas.height);
					canvas.toBlob(function (blob) {
						room.send(blob);
					});
				}
			},2000);
		}).catch(function (error){
			console.error('could not get user media:', error);
			sweetAlert('ERROR!!', 'please reload this page', 'error');
			return;
		});
	}
	else{
		room=peer.joinRoom('3waychat_'+roomname,{mode:'sfu',stream:localStream});
		RoomManager(room);
	}

	swal({
		title: 'Success!',
		text: 'あなたは'+roomname+ 'に入室しました。',
		typr:'success',
		timer: 1500,
		showConfirmButton: true
	});
}
$('#exit-button').click(function(){
	room.close();
	localStream=null;
	if(MODE===1){
		$('#my-video').prop('src', '');
		$('#peer-videos-area').empty();
	}
	else if (MODE===2) {
		$('#audio-area').empty();
		$('#peer-videos-area').empty();
	}

	init();
});

$('#send-button').click(function() {
	var msg=$('#send-msg').val();
	console.log(msg);
	room.send(msg);

	$('#send-msg').val('');
});
function RoomManager(room) {
	room.on('stream', function(stream){
		var streamURL = URL.createObjectURL(stream);
		var peerId = stream.peerId;

		if(MODE===1){
			$('#peer-videos-area').append($(
				'<div id="div_' + peerId+'">'+
				'<video autoplay class="remoteVideos" src="' + streamURL + '" id="video_' + peerId + '"></video><br>' +
				'<span style="text-align;center;">'+peerId+'</span>'+
				'</div>'));
		}
		else if (MODE===2) {
			$('#audio-area').append($(
				'<div id="div_' + peerId+'">'+
				'<audio autoplay class="remoteAudios" src="' + streamURL + '" id="audio_' + peerId + '" autoplay/>' +
				'</div>'));
			$('#peer-videos-area').append($(
				'<div id="div_image_' + peerId+'">'+
				'<img class="remoteCanvas" id="image_' + peerId + '"/><br>' +
				'<span style="text-align;center;">'+peerId+'</span>'+
				'</div>'));
		}
	});

	room.on('removeStream', function(removedStream) {
		$('#div_' + removedStream.peerId).remove();
		if(MODE===2){
			$('#div_image_' + removedStream.peerId).remove();
		}
	});

	room.on('data', function(message) {
		if (message.data instanceof ArrayBuffer) {
			var dataView = new Uint8Array(message.data);
			var dataBlob = new Blob([dataView]);
			var url = window.URL.createObjectURL(dataBlob);
			$('#image_'+message.src).attr('src',url);
		} else {
			$('#receive-msg').append('<div>' + message.src + ': ' + message.data + '</div>');
		}
	});
}