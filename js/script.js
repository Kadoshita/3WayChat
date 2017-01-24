navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var peer = new Peer({
	key: 'Your API Key',
	debug: 3
});
var room;
var localStream=null;
peer.on('error', function(err){
	alert(err.message);
});
$(function(){
	$('#enter-button').click(function() {
		console.log(MODE);
		var roomname=$('#room-name').val();
		if(!roomname){
			return;
		}
		console.log(roomname);
		if(MODE===1){
			navigator.mediaDevices.getUserMedia({video: true, audio: true})
			.then(function (stream){
				localStream=stream;
				$('#my-video').prop('src', URL.createObjectURL(stream));

				room=peer.joinRoom('3waychat_'+roomname,{mode:'sfu',stream:localStream});
				RoomManager(room);
			}).catch(function (error){
				console.error(error);
				alert('ERROR!! please reload this page');
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
				alert('ERROR!! please reload this page');
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
				return;
			});
		}
		else{
			room=peer.joinRoom('3waychat_'+roomname,{mode:'sfu',stream:localStream});
			RoomManager(room);
		}
		
	});
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
	});

	$('#send-button').click(function() {
		var msg=$('#send-msg').val();
		console.log(msg);
		room.send(msg);
	});
});

function RoomManager(room) {
	room.on('stream', function(stream){
		var streamURL = URL.createObjectURL(stream);
		var peerId = stream.peerId;

		if(MODE===1){
			$('#peer-videos-area').append($(
				'<div id="div_' + peerId+'">'+
				'<video autoplay class="remoteVideos" src="' + streamURL + '" id="video_' + peerId + '"><br>' +
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