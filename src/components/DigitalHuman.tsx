import StreamTalk from "../lib/did/steam-talk"
import React, { useEffect, useRef, useState } from "react";

interface DigitalHumanProps {
  isTriggerConnect: boolean
  audioUrl: string
  textContent: string
}
export const DigitalHuman = ({
  isTriggerConnect,
  audioUrl,
  textContent
}: DigitalHumanProps) => {
  const talkVideoRef = useRef<HTMLVideoElement | null>(null)
  const iceGatheringStatusLabelRef = useRef<HTMLLabelElement | null>(null)
  const iceStatusLabelRef = useRef<HTMLLabelElement | null>(null)
  const streamingStatusLabelRef = useRef<HTMLLabelElement | null>(null)
  const peerStatusLabelRef = useRef<HTMLLabelElement | null>(null)
  const signalingStatusLabelRef = useRef<HTMLLabelElement | null>(null)
  const [streamTalk, setStreamTalk] = useState<StreamTalk | null>(null)

  useEffect(() => {
    if (isTriggerConnect) {
      streamTalk?.onConnect()
    } else {
      if (streamTalk) {
        streamTalk.onDestroy()
      }
    }
  }, [isTriggerConnect])

  useEffect(() => {
    if (textContent.length && streamTalk) {
      streamTalk.onTalk(textContent)
    }
  }, [textContent])

  useEffect(() => {
    if (streamTalk) {
      streamTalk.onInit({
        talkVideo: talkVideoRef.current!,
        iceGatheringStatusLabel: iceGatheringStatusLabelRef.current!,
        iceStatusLabel: iceStatusLabelRef.current!,
        streamingStatusLabel: streamingStatusLabelRef.current!,
        peerStatusLabel: peerStatusLabelRef.current!,
        signalingStatusLabel: signalingStatusLabelRef.current!,
      })
    }
  }, [streamTalk])

  useEffect(() => {
    const streamTalkInstace = new StreamTalk()
    setStreamTalk(streamTalkInstace)
  }, [])

  return (
    <>
     <div id="content" className="mt-10 p-4 bg-gray-100 rounded-lg shadow-lg container mx-auto">
        <div id="video-wrapper" className="flex justify-center mb-4">
          <div
            className="h-[400px] w-[400px] border-2 border-gray-300 rounded-lg overflow-hidden"
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "#f5f5f5"
            }}
          >
            <video
              id="talk-video"
              className="w-full h-full"
              style={{
                width: "100%",
                height: "100%"
              }}
              autoPlay
              playsInline
              ref={talkVideoRef}
            ></video>
          </div>
        </div>
        <div id="status" className="text-sm text-gray-700 mb-4">
          <div>ICE gathering status: <label id="ice-gathering-status-label" ref={iceGatheringStatusLabelRef}></label></div>
          <div>ICE status: <label id="ice-status-label" ref={iceStatusLabelRef}></label></div>
          <div>Peer connection status: <label id="peer-status-label" ref={peerStatusLabelRef}></label></div>
          <div>Signaling status: <label id="signaling-status-label" ref={signalingStatusLabelRef}></label></div>
          <div>Streaming status: <label id="streaming-status-label" ref={streamingStatusLabelRef}></label></div>
        </div>
      </div>
    </>
  )
}