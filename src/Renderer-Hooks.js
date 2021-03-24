import React, { useEffect, useState } from "react";

// update url with target editor
export let makecodeUrl = "https://makecode.microbit.org/";
// force language if needed
export let lang = undefined;

let rendererReady = false;
let rendererError = "";
let nextRequest = 0;
const pendingRequests = {};

function renderBlocks(req, cb) {
  req.id = nextRequest++ + "";
  pendingRequests[req.id] = { req, cb };
  if (rendererReady) sendRequest(req);
}
function sendRequest(req) {
  const f = startRenderer();
  if (f) f.contentWindow.postMessage(req, makecodeUrl);
}
// listen for messages
function handleMessage(ev) {
  let msg = ev.data;
  if (msg.source !== "makecode") return;
  switch (msg.type) {
    case "renderready":
      rendererReady = true;
      rendererError = undefined;
      Object.keys(pendingRequests).forEach((k) =>
        sendRequest(pendingRequests[k].req)
      );
      break;
    case "renderblocks":
      const id = msg.id; // this is the id you sent
      const r = pendingRequests[id];
      if (!r) return;
      delete pendingRequests[id];
      r.cb(msg);
      break;
    default:
      break;
  }
}
function startRenderer() {
  if (!makecodeUrl) return undefined;
  let f = document.getElementById("makecoderenderer");
  if (f) return f;
  window.addEventListener("message", handleMessage, false);
  f = document.createElement("iframe");
  f.id = "makecoderenderer";
  f.style.position = "absolute";
  f.style.left = "0";
  f.style.bottom = "0";
  f.style.width = "100px";
  f.style.height = "100px";
  f.src = `${makecodeUrl}--docs?render=1${lang ? `&lang=${lang}` : ""}`;
  document.body.appendChild(f);
  // check if connection failed
  setTimeout(function () {
    if (!rendererReady)
      rendererError =
        "Oops, can't connect to MakeCode. Please check your internet connection.";
  }, 30000);
  return f;
}

export default function Snippet( props ) {

  const { code, packageId, package: _package, snippetMode } = props;
  
  const [uri, setURI] = useState();
  const [width, setWidth] = useState();
  const [height, setHeight] = useState();
  const [error, setError] = useState();
  const [rendering, setRendering] = useState(false);

  function renderProps() {
    // clear state and render again
    const { code, packageId, package: _package, snippetMode } = props;
    // console.log(code)
    if (code) {
      setRendering(true);
      renderBlocks(
        {
          type: "renderblocks",
          id: "",
          code,
          options: {
            packageId,
            package: _package,
            snippetMode,
          },
        },
        (resp) => {
          setURI(resp.uri);
          console.log(resp)
          setWidth(resp.width);
          setHeight(resp.height);
          setError(resp.error);
          setRendering(false);
        }
      );
    }
  }
  
  useEffect(() => {
    startRenderer();
  }, [])

  useEffect(() => {
    renderProps()
  }, [code, packageId, _package, snippetMode])

    return (
      <div>
        {/* Waiting for frame to start */}
        {!rendererReady || rendering ? <div className="ui active inverted dimmer"> <div className="ui loader"> </div> </div> : undefined}
        {/* Is there any error? */}
        {(error || rendererError) ? <div className="ui message info"> {error || rendererError} </div> : undefined}
        {/* Display code if blocks rendering fails */}
        {(!rendererReady || (error || rendererError) || !uri ? code : undefined) ? <pre> <code> {(!rendererReady || !rendererReady || (error || rendererError) || !uri ? code : undefined)} </code> </pre> : undefined}
        {uri ? <img className="ui image" alt={code} src={uri} width={width} height={height} /> : undefined}
      </div>
    );
}