import React from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import Split from "react-split";
import { addDoc, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { notesCollection, db } from "./firebase";

export default function App() {
  const [notes, setNotes] = React.useState([]);
  const [currentNoteId, setCurrentNoteId] = React.useState("");
  // tempText is used to store text between data submission
  const [tempText, setTempText] = React.useState("");

  const currentNote = notes.find((note) => note.id === currentNoteId) || notes[0];
  const sortedArray = notes.sort((note1, note2) => note2.updatedAt - note1.updatedAt);

  async function createNewNote() {
    const newNote = {
      body: "# Type your markdown note's title here",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newNoteRef = await addDoc(notesCollection, newNote);
    setCurrentNoteId(newNoteRef.id);
  }

  async function deleteNote(event, noteId) {
    event.stopPropagation();
    const docRef = doc(db, "notes", noteId);
    await deleteDoc(docRef);
  }

  async function updateNote(text) {
    const docRef = doc(db, "notes", currentNoteId);
    await setDoc(docRef, { body: text, updatedAt: Date.now() }, { merge: true });
  }

  React.useEffect(() => {
    // Snapshot is the most updated version from the db
    // onSnapshot returns a function that will unsubscribe
    const unsubscribe = onSnapshot(notesCollection, function (snapshot) {
      // Code to sync up our local notes array with the snapshot data
      const notesArr = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setNotes(notesArr);
    });
    // Setting `onSnapshot` listener subscribes the code to the websocket
    // We need to provide a way to unsubscribe from it if comonents is unmounted
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (currentNote) {
      setCurrentNoteId(currentNote.id);
    } else {
      setCurrentNoteId(notes[0]?.id);
    }
  }, [notes]);

  React.useEffect(() => {
    if (currentNote) {
      setTempText(currentNote.body);
    }
  }, [currentNote]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tempText !== currentNote.body) {
        updateNote(tempText);
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [tempText]);

  return (
    <main>
      {notes.length > 0 ? (
        <Split sizes={[20, 80]} direction="horizontal" className="split">
          <Sidebar
            notes={sortedArray}
            currentNote={currentNote}
            setCurrentNoteId={setCurrentNoteId}
            newNote={createNewNote}
            deleteNote={deleteNote}
          />
          <Editor tempText={tempText} setTempText={setTempText} />
        </Split>
      ) : (
        <div className="no-notes">
          <h1>You have no notes</h1>
          <button className="first-note" onClick={createNewNote}>
            Create one now
          </button>
        </div>
      )}
    </main>
  );
}
