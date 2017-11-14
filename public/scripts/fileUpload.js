window.addEventListener("load", function() {
  var file = {
    dom:    document.getElementById("uploadFile"),
    binary: null
  };

  var reader = new FileReader();
  console.log(reader);

  reader.addEventListener("load", function() {
    file.binary = reader.result;
  });


  if(file.dom.files[0]) {
    reader.readAsBinaryString(file.dom.files[0]);
  }

  file.dom.addEventListener("change", function() {
    debugger;
    if(reader.readyState == FileReader.LOADING){
      reader.abort();
    }

    reader.readAsBinaryString(file.dom.files[0]);
  });
  // This function will do
  function sendData() {
    if(!file.binary && file.dom.files.length > 0) {
      setTimeout(sendData, 10);
      return;
    }

    var xhr = new XMLHttpRequest();

    var boundary = "blob";
    var data = "";

    if(file.dom.files[0]) {
      data += "--" + boundary + "\r\n";

      data += 'Content-Disposition: form-data; '
        + 'name="'         + file.dom.name          + '"; '
        + 'filename="'     + file.dom.files[0].name + '"\r\n';
      data += 'Content-type: ' + file.dom.files[0].type + '\r\n';
      data += '\r\n';
      data += file.binary + '\r\n';
      data += "--" + boundary + "--\r\n";
      console.log(data);
    }


    xhr.addEventListener("load", function(event) {
      var fileInfo = document.getElementById("fileInfo");
      var file = JSON.parse(xhr.responseText);
      var fileName = file.fileName;
      var userName = file.userName;
      var fileSize = file.fileSize;
      var filePath  = file.filePath;

      fileInfo.innerHTML += "<ul>" +
                             "<li class='" + "fileName'>" + fileName + "</li>" +
                             "<li class='" + "fileOwner'>" + userName + "</li>" +
                             "<li class='" + "fileSize'>" + fileSize + "</li>" +
                           "</ul>";
    });

    xhr.addEventListener("error", function(event) {
      alert("Oops! something went wrong.");
    });

    xhr.open("POST", "/upload", true);
    xhr.setRequestHeader('Content-Type','multipart/form-data; boundary=' + boundary);
    xhr.send(data);
  }
  var form = document.getElementById("uploadForm");

  form.addEventListener("submit", function(event) {
    event.preventDefault();
    sendData();
  });
});
