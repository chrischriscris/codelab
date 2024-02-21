import { useEffect, useState } from "react";

import CodeMirror from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import { basicSetup } from "@uiw/codemirror-extensions-basic-setup";
import { indentUnit } from "@codemirror/language";

import { type Socket } from "socket.io-client";
import { getDocument, peerExtension } from "../utils/collab";

type Mode = "light" | "dark";

interface EditorElementProps {
  socket: Socket;
  className?: string;
}

export default function EditorElement(props: EditorElementProps) {
  const [connected, setConnected] = useState(false);
  const [version, setVersion] = useState<number>();
  const [doc, setDoc] = useState<string>();
  const [mode, setMode] = useState<Mode>(
    window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );

  useEffect(() => {
    async function fetchData() {
      const { version, doc } = await getDocument(props.socket);
      setVersion(version);
      setDoc(doc.toString());
    }
    fetchData();

    props.socket.on("connect", () => {
      setConnected(true);
    });

    props.socket.on("disconnect", () => {
      setConnected(false);
    });

    // Change to dark mode or light mode depending on settings.
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        const mode = event.matches ? "dark" : "light";
        setMode(mode);
      });

    return () => {
      props.socket.off("connect");
      props.socket.off("disconnect");
      props.socket.off("pullUpdateResponse");
      props.socket.off("pushUpdateResponse");
      props.socket.off("getDocumentResponse");
    };
  }, [props.socket]);

  if (version == null || doc == null) {
    return <span>loading...</span>;
  }

  return (
    <CodeMirror
      className={`flex-1 overflow-scroll text-left ${props.className}`}
      height="100%"
      basicSetup={false}
      id="codeEditor"
      theme={mode}
      extensions={[
        indentUnit.of("\t"),
        basicSetup(),
        langs.c(),
        peerExtension(props.socket, version ?? 0),
      ]}
      value={doc}
    />
  );
}
