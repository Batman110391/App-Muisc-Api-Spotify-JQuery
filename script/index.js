const client_id = "c643a420abf040a8bbad3665b466e1e9";
const client_secret = "f2635a239e7246059705269dc8902df2";
const redirect_uri = "http%3A%2F%2F127.0.0.1%3A5500%2Fcallback.html";

$(document).ready( () => {

    //verifico che l utente si trovi nel LOGIN
    if(window.location.pathname == "/login.html"){
        $('#login').click(() => { 
            const scopes = 'user-read-private user-read-email user-top-read'
            window.location.href = "https://accounts.spotify.com/authorize?client_id="+client_id+"&response_type=code&redirect_uri="+redirect_uri+"&scope="+scopes+"&state=34fFs29kd09&show_dialog=true";
        });
    }

    //verifico che l utente si trovi nel CALLBACK
    if (window.location.pathname == "/callback.html"){

        //richiesta per prendere il token_access!
        getTokenUtent()
    }

    //verifico che l utente si trovi nell'INDEX
    if (window.location.pathname == "/index.html"){

        //ultreriore verifica nel caso in cui l'utente si trovi nell index senza avere l'access token
        if(JSON.parse(localStorage.getItem('access_token')) == null && window.location.pathname != "/login.html"){
            if(window.location.pathname !== '/callback.html' ){
                window.location.href = '/login.html'
            }
        } 

        $('#logout').click( () => { 
            //cancello la memoria ed esco dall index
            localStorage.clear();
            window.location.href = '/login.html';
            
        });

        $('.fa-search').click( () => { 
            //cancello la memoria ed esco dall index
            $("#subInput").submit();
        });
    
       $("#subInput").submit( (e) => {
            e.preventDefault();

            if($('#search-text').val() != ""){
                let text = getSearchText();
                let url = "https://api.spotify.com/v1/search?q="+text+"&type=track&offset=0&limit=20";
                
                //passo a getMuisc il testo codificato diviso da %20 come richiesto da spotify
                let operation = "search";
                getMusic(url, operation);
            }
            
        });  
    }
    
});

// genera chiamate al server di spotify
function getMusic(url, operation) {

        $.ajax({
          url: url,
          type: 'GET',
          headers: {
              'Authorization' : 'Bearer ' + JSON.parse(localStorage.getItem('access_token'))
          },
          success: (data) => {          

            $(".container-song").empty();
            
            appendSearchSong(data); 
            
          },
            error: function(err){
         
            //in caso in cui il token fosse scaduto (cioè dopo 60min) ne richiedo uno nuovo e riprovo a chiamare la funzione get
            //con il token nuovo.. ovvero il refresh_Token
            getRefreshToken();
            getMusic(url, operation);
            }
         }); 
}

function appendSearchSong(data) {

    const total_traks = data.tracks.items;
	const MAX_SONG = data.tracks.items.length;
    let src_song, iframe;

    for (let i = 0; i<MAX_SONG; i++){
        src_song = "https://open.spotify.com/embed/track/"+total_traks[i].id;
        iframe = "<div class='display-song'><div class='song'><iframe src="+src_song+" frameborder='0' allowtransparency='true' allow='encrypted-media'></iframe></div></div>";
        
        $(".container-song").append(iframe);
    } 
}

//codifico il valore nell input e lo restituisco
function getSearchText() {
    let textInput = $('#search-text').val();
    let search_query = encodeURI(textInput);

    return search_query;
}

//Autorizzazione da parte del cliente per prendere il token

function getTokenUtent () {
    let params = new URLSearchParams(document.location.search.substring(1));
    let code = params.get('code');
    $.ajax({
        type: 'POST',
        url: 'https://accounts.spotify.com/api/token', 

        //i parametri richiesti del body vanno in data in jquery:
        data: 'grant_type=authorization_code&code='+code+'&redirect_uri='+redirect_uri,
        headers: {
          'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret)
        },
        success: (data) => {
          console.log('Succes:', data);
          localStorage.setItem('access_token', JSON.stringify(data.access_token))
          localStorage.setItem('refresh_token', JSON.stringify(data.refresh_token))

          window.location.href = '/index.html';

        },
        error: (error) => {

         // in caso di errore avverto l'utente e lo riporto nel login
          window.location.href = '/login.html';
          alert(error)
        }
    });
}


function getRefreshToken () {
   
    $.ajax({
        type: 'POST',
        url: 'https://accounts.spotify.com/api/token', 

        //i parametri richiesti del body vanno in data in jquery:
        data: 'grant_type=refresh_token&refresh_token='+JSON.parse(localStorage.getItem('refresh_token')),
        headers: {
          'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret)
        },
        success: (data) => {
        
        localStorage.setItem('access_token', JSON.stringify(data.access_token))

        },
        error: (error) => {
         // in caso di errore avverto l'utente e lo riporto nel login
          window.location.href = '/login.html';
          alert(error)
        }
    });
}
