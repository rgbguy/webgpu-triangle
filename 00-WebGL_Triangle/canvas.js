let canvas = null;
let gl = null;
let bFullScreen = false;

let canvasOriginal_width;
let canvasOriginal_height;

// webGL related letiables
const myAttributes =
{
    ATTRIBUTE_POSITION : 0,
    ATTRIBUTE_COLOR : 1,
};

let shaderProgramObject = null; // null because it's an object unlike windows/linux's GLuint
let mvpUniform;
let vao = null;
let vbo_position = null;
let vbo_color = null;


let perspectiveProjectionMatrix; 

let requestAnimationFrame =
    window.requestAnimationFrame ||     
    window.mozRequestAnimationFrame ||  
    window.oRequestAnimationFrame ||    
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame; 

function main() {
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

    initialize();
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

function initialize()
{
   // get 2D context from canvas
    gl = canvas.getContext("webgl2");
    if(gl == null)
    {
        console.log("main(): gl cannot be obtained\n")
    }
    else
    {
        console.log("main(): gl successfully obtained\n");
    }
    // set context viewport width & height: an original idiosynchracy of WebGL
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    gl.clearColor(0.0, 0.0, 1.0, 1.0);

    //vertex shader
    let vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
    let vertexShaderSourceCode = 
        "#version 300 es\n" +
        "in vec4 aPosition;\n" +
        "in vec4 aColor;\n" +
        "out vec4 outColor;\n" +
        "uniform mat4 uMVPMatrix;\n" +
        "void main(void)\n" +
        "{\n" +
        "   outColor = aColor;\n" +
        "   gl_Position = uMVPMatrix*aPosition;\n" +
        "}\n";
    gl.shaderSource(vertexShaderObject, vertexShaderSourceCode);
    gl.compileShader(vertexShaderObject);

    if(gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS) == false)
    {
        let error = gl.getShaderInfoLog(vertexShaderObject);
        if(error.length > 0)
        {
            alert(error);
            uninitialize();
        }
    }
    else
    {
        console.log("initialize(): vertex shader compilation success \n");
    }

    //fragment shader
    let fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
    let fragmentShaderSourceCode = 
        "#version 300 es\n" +
        "precision highp float;\n" +
        "in vec4 outColor;\n" +
        "out vec4 FragColor;\n" +
        "void main(void)\n" +
        "{\n" +
        "   FragColor = outColor;\n" +
        "}\n";
    gl.shaderSource(fragmentShaderObject, fragmentShaderSourceCode);
    gl.compileShader(fragmentShaderObject);

    if(gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS) == false)
    {
        let error = gl.getShaderInfoLog(fragmentShaderObject);
        if(error.length > 0)
        {
            alert(error);
            uninitialize();
        }
    }
    else
    {
        console.log("initialize(): fragment shader compilation success \n");
    }

    //shader program
    shaderProgramObject = gl.createProgram();
    gl.attachShader(shaderProgramObject, vertexShaderObject);
    gl.attachShader(shaderProgramObject, fragmentShaderObject);
    gl.bindAttribLocation(shaderProgramObject, myAttributes.ATTRIBUTE_POSITION, "aPosition");
    gl.bindAttribLocation(shaderProgramObject, myAttributes.ATTRIBUTE_COLOR, "aColor");
    gl.linkProgram(shaderProgramObject);

    if(gl.getProgramParameter(shaderProgramObject, gl.LINK_STATUS) == false)
    {
        let error = gl.getProgramInfoLog(shaderProgramObject);
        if(error.length > 0)
        {
            alert(error);
            uninitialize();
        }
    }
    else
    {
        console.log("initialize(): shader program linking success \n");
    }

    mvpUniform = gl.getUniformLocation(shaderProgramObject, "uMVPMatrix");

    let trianglePosition = new Float32Array([
        0.0,  1.0, 0.0,
       -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ]);

    let triangleColors = new Float32Array([
        1.0,  0.0, 0.0,
        0.0,  1.0, 0.0,
        0.0,  0.0, 1.0
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    //==================VAO starts==================
    vbo_position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_position);
    gl.bufferData(gl.ARRAY_BUFFER, trianglePosition, gl.STATIC_DRAW);
    gl.vertexAttribPointer(myAttributes.ATTRIBUTE_POSITION, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(myAttributes.ATTRIBUTE_POSITION);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    vbo_color = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo_color);
    gl.bufferData(gl.ARRAY_BUFFER, triangleColors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(myAttributes.ATTRIBUTE_COLOR, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(myAttributes.ATTRIBUTE_COLOR);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //==================VAO ends==================
    gl.bindVertexArray(null);

    // enable depth testing
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.2, 0.2, 0.2, 1.0);

    perspectiveProjectionMatrix = mat4.create();
    mat4.identity(perspectiveProjectionMatrix);
}

function resize()
{
    if(bFullScreen)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    else
    {
        canvas.width = canvasOriginal_width;
        canvas.height = canvasOriginal_height;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    mat4.perspective(perspectiveProjectionMatrix, 45.0, parseFloat(canvas.width)/parseFloat(canvas.height), 0.0, 100.0);
}

function display()
{
    // code
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shaderProgramObject);

    // matrices
    let modelViewMatrix = mat4.create(); // create() makes it identity
    let translationMatrix = mat4.create();
    mat4.translate(translationMatrix, translationMatrix, [0.0, 0.0, -3.0]);
    modelViewMatrix = translationMatrix;
    let modelViewProjectionMatrix = mat4.create();
    mat4.multiply(modelViewProjectionMatrix, perspectiveProjectionMatrix, modelViewMatrix);

    // uniforms
    gl.uniformMatrix4fv(mvpUniform, false, modelViewProjectionMatrix);

    // drawing
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);

    // unbind shader program
    gl.useProgram(null);

    requestAnimationFrame(display, canvas);

    update();
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

    if(vbo_position)
    {
        gl.deleteBuffer(vbo_position);
        vbo_position = null;
    }

    if(vao)
    {
        gl.deleteVertexArray(vao);
        vao = null;
    }

    if(shaderProgramObject)
    {
        gl.useProgram(shaderProgramObject);
        let shaderObjects = gl.getAttachedShaders(shaderProgramObject);
        // let vs let => scope. let is available throught the function local scope. let will be bound to the block.
        for(let i = 0; i < shaderObjects.length; i++) 
        {
            gl.detachShader(shaderProgramObject, shaderObjects[i]);
            gl.deleteShader(shaderObjects[i]);
            shaderObjects[i] = null;
        }
        gl.useProgram(null);
        gl.deleteProgram(shaderProgramObject);
        shaderProgramObject = null;
    }
}