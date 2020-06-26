const path = require('path')

    const os = require('os')

    let fs = require('fs')

    const { ipcRenderer } = require('electron')



    document.addEventListener('DOMContentLoaded', function() {
        var elems = document.querySelectorAll('.collapsible');
        var instances = M.Collapsible.init(elems);
    });

    const form = document.getElementById('image-form')
    let slider = document.getElementById('slider')

    let imageSource = document.getElementById('image-details')
    let img = document.getElementById('img')
    let inputMime = document.getElementById('input-mime')
    let inputName = document.getElementById('input-name')
    let inputDimension = document.getElementById('input-dimension')
    let inputSize = document.getElementById('input-size')
    let inputDateTime = document.getElementById('input-datetime')
    let inputPath = document.getElementById('input-path')

    let imageMime = document.getElementById('image-mime')
    let imageName = document.getElementById('image-name')
    let imageDimension = document.getElementById('image-dimension')
    let imageSize = document.getElementById('image-size')
    let outputSize = document.getElementById('output-size')
    let oldSize = document.getElementById('old-size')
    let imageDateTime = document.getElementById('image-datetime')
    let imagePath = document.getElementById('image-path')
    let newImageDetails = document.getElementById('new-image-details')


    document.getElementById('output-path').innerText = path.join(
            os.homedir(),
            'imageshrinkOutput'
        )

        function displayImageDetails(mime,name,size,dateTime,sourcePath,width,height) {

            imageSource.removeAttribute('hidden');

            inputMime.innerText = mime;
            inputName.innerText = name;
            inputDimension.innerText = `${width}x${height} `;
            inputSize.innerText = prettySize(size);
            inputDateTime.innerText = dateTime;
            inputPath.innerText = sourcePath;
        }

        function displayNewImageDetails(mime,name,size,dateTime,sourcePath) {

            newImageDetails.removeAttribute('hidden');

            imageMime.innerText = mime;
            imageName.innerText = name;
            imageSize.innerText = prettySize(size);
            imageDateTime.innerText = dateTime;
            imagePath.innerText = sourcePath;
        }

        function handleFiles() {

            const fileList = this.files; /* now you can work with the file list */
            const numFiles = fileList.length;

            for (let i = 0, numFiles = fileList.length; i < numFiles; i++) {
                
                const file = fileList[i];

                let mime = file.type;
                let name = file.name;
                let size = file.size;
                let dateTime = file.lastModifiedDate;
                let sourcePath = file.path;
                

                var reader = new FileReader();

                //Read the contents of Image File.
                reader.readAsDataURL(file);
                
                reader.onload = function (e) {

                    //Initiate the JavaScript Image object.
                    var image = new Image();

                    //Set the Base64 string return from FileReader as source.
                    image.src = e.target.result;
                    

                    // Validate the File Height and Width.
                    image.onload = function () {
                        var height = this.height;
                        var width = this.width;

                        displayImageDetails(mime,name,size,dateTime,sourcePath,width,height)

                        let showCurrentSize = document.getElementById('currentSize');

                        showCurrentSize.removeAttribute('hidden');

                        oldSize.innerText = prettySize(size);
                    
                    }
                };
            
            }


        }

        function showFileMime(extension) {

            if (extension == 'jpg' || 'jpeg') {

                return "image/jpeg";

            }
            else if(extension == 'png') {

                return "image/png";
                
            }
            else if(extension == 'svg'){

                return "image/svg+xml";

            }
            else {
                return "image/gif";
            }

        }

        function prettySize(bytes, separator = '', postFix = '') {
            if (bytes) {
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.min(parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString(), 10), sizes.length - 1);
                return `${(bytes / (1024 ** i)).toFixed(i ? 1 : 0)}${separator}${sizes[i]}${postFix}`;
            }
            return 'n/a';
        }

    //OnUpload
    img.addEventListener("change", handleFiles, false);

    // OnSubmit
    form.addEventListener('submit', e => {
        e.preventDefault()

        const imgPath = img.files[0].path
        const quality = slider.value

        ipcRenderer.send('image:minimize', {
            imgPath,
            quality
        })
        
    })

    // On done
    ipcRenderer.on('image:done', (event, data) => {

        M.toast({
            html: `Image resized to ${slider.value}% quality`,
        })

        const newFilePath = data;
        

        let reader = fs.createReadStream(`${newFilePath}`); 

        var filename = newFilePath.split("/").pop();

        var extension = newFilePath.split('.').pop();

        var fileMime = showFileMime(extension);

        reader.on('data', function (chunk) { 

            newFile = new File(chunk,`${filename}`,{
                
                type: fileMime

            });

            let newFileSize = newFile.size
            let updatedFile = newFile.lastModifiedDate

            let showNewSize = document.getElementById('newSize');

            showNewSize.removeAttribute('hidden');

            outputSize.innerText = prettySize(newFileSize);

            displayNewImageDetails(fileMime,filename,newFileSize,updatedFile,newFilePath)

        }); 
        
        
        

    })