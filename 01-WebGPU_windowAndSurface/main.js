let bFullScreen = false;

let canvasOriginal_width;
let canvasOriginal_height;

// WebGPU related
let gpu = null;
let adapter = null;
let device = null;
let queue = null;
let context = null;
let canvasFormat = null;

let requestAnimationFrame =
    window.requestAnimationFrame ||     
    window.mozRequestAnimationFrame ||  
    window.oRequestAnimationFrame ||    
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame; 

async function main()
{
    //code
    //getcanvas
    canvas = document.getElementById("RGBGUY");  // document = builtin letiable in DOM
    if(canvas == null)
    {
        console.log("Canvas element cannot be obtained\n")
    }
    else
    {
        console.log("Canvas element successfully obtained\n");
    }

    canvasOriginal_width = canvas.width;
    canvasOriginal_height = canvas.height;

 
    // event listners
    window.addEventListener("keydown", keyDown, false);
    window.addEventListener("click", mouseDown, false);
    window.addEventListener("resize", resize, false);

    await initialize();
    resize();
    display();

}

function keyDown(event)
{
    // code
    switch(event.keyCode)
    {
        case 70: //F
        case 102: //f
            toggleFullScreen();
        break;

        case 27: //Esc key
            uninitialize();
            window.close();
            break;
    }
}

function mouseDown()
{
    // code
}

function toggleFullScreen()
{
    //
    let fullScreen_element = 
    document.fullscreenElement || 
    document.mozFullScreenElement ||
    document.webkitFullScreenElement ||
    document.msFullScreenElement ||
    null;

    if(fullScreen_element == null)
    {
        if(canvas.requestFullscreen)
            canvas.requestFullscreen();
        else if(canvas.mozRequestFullScreen)
            canvas.mozRequestFullScreen();
        else if(canvas.webkitRequestFullscreen)
            canvas.webkitRequestFullscreen();
        else if(canvas.msRequestFullscreen)
            canvas.msRequestFullscreen();

        bFullScreen = true;
        
    }
    else
    {
        if(document.exitFullscreen)
            document.exitFullscreen();
        else if(document.mozExitFullScreen)
            document.mozExitFullScreen();
        else if(document.webkitExitFullscreen)
            document.webkitExitFullscreen();
        else if(document.msExitFullscreen)
            document.msExitFullscreen();

        bFullScreen = false;
    }
}

async function initialize()
{
    if (!navigator.gpu) {
        alert("WebGPU not supported");
        return;
    }

    adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        alert("Failed to get GPU adapter");
        return;
    }

    device = await adapter.requestDevice();
    queue = device.queue;

    context = canvas.getContext("webgpu");
    canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device: device,
        format: canvasFormat,
        alphaMode: "opaque"
    });
}

function resize()
{
    if (bFullScreen)
    {
        canvas.width  = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;
    }
    else
    {
        canvas.width  = canvasOriginal_width;
        canvas.height = canvasOriginal_height;
    }

    if (context)
    {
        context.configure({
            device: device,
            format: canvasFormat,
            alphaMode: "opaque"
        });
    }
}
function display()
{
    const encoder = device.createCommandEncoder();

    const renderPass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0.0, g: 0.0, b: 1.0, a: 1.0 },
            loadOp: "clear",
            storeOp: "store"
        }]
    });

    renderPass.end();

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(display);
}


function update()
{

}

function uninitialize()
{
    if(bFullScreen == true)
    {
        toggleFullScreen();
    }
}