'use client';
import Container from "./container";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { FormEvent, useCallback, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Select from "react-select";
import Feedback from "./feedback";
import { APP_VERSION } from "../../config"
import { modelConfigData, languageOptionData } from "../lib/data";

export const runtime = 'edge';

const dbClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PRIVATE_KEY
);

type Option = {
    readonly idx?: number;
    readonly value: string;
    readonly label: string;
}

export default function Translate() {
    const modelOptions: Option[] = modelConfigData.map(({ modelConfigId, modelConfigName, modelConfigLabel }) => ({
        idx: modelConfigId,
        value: modelConfigName,
        label: modelConfigLabel
    }));

    const languageOptions: Option[] = languageOptionData.map((data, idx) => ({
        ...data,
        idx
    }));

    const [translateMode, setTranslateMode] = useState("");

    //feedback stuff including modal state
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackEnabled, setFeedbackEnabled] = useState(false);
    const [selectedVote, setSelectedVote] = useState<'upvote' | 'downvote' | null>(null);

    const [inputValue, setInputValue] = useState("");
    const [clipboardBtnText, setClipboardBtnText] = useState("Copy to Clipboard");
    const [modelConfigId, setModelConfigId] = useState(modelOptions[0].idx); //default to the first model in the list
    const [userId, setUserId] = useState(1); // later we can add users

    const [inflight, setInflight] = useState(false);
    const [submitBtnVisible, setSubmitBtnVisible] = useState(false);
    const [submitBtnEnabled, setSubmitBtnEnabled] = useState(false);
    const [submitBtnText, setSubmitBtnText] = useState("Translate");
    const [results, setResults] = useState("Results will appear here.");
    const [showResetButton, setShowResetButton] = useState(false);

    const [transactionId, setTransactionId] = useState(""); //this id for translation will be used to assign the feedback to the correct translation record

    //useeffect to check the state of the voting variables and log them
    useEffect(() => {
        console.log('modelConfigId ' + modelConfigId );
    }, [modelConfigId]);


    // Eventually should move this to a route  
    // returns the transactionId
    const writeTranslationToDb = async (resultsText: String) => {
        let transactionId = "";
        let sourceLang = getInputLangFromTranslateMode();
        let targetLang = getOutputLangFromTranslateMode();
        console.log("writing to db for sourcelang " + sourceLang + " and targetlang " + targetLang);
        try {
            let { data, error } = await dbClient
                .from('translations')
                .insert({ user_id: userId, model_config: modelConfigId, prompt: inputValue, source_lang: sourceLang, target_lang: targetLang, response: resultsText, app_version: APP_VERSION, is_development: process.env.NEXT_PUBLIC_IS_DEVELOPMENT })
                .select();
            if (error) {
                console.log("m " + error.message);
                console.log("h " + error.hint);
                console.log("d " + error.details);
                return transactionId;
            }
            if (data) {
                console.log('data is not null');
                transactionId = data[0].transaction_id;
            }
        } catch (error) {
            console.log('New transaction insert error', error);
        } finally {
            return transactionId;
        }
    }

    const updateTranslationWithFeedback = async (feedbackVote: String, feedbackText: String, transactionId: String) => {
        console.log("updating db with feedback " + feedbackVote + " and text " + feedbackText + " for transaction " + transactionId);
        try {
            let { data, error } = await dbClient
                .from('translations')
                .update({ feedback_vote: feedbackVote, feedback_text: feedbackText })
                .eq('transaction_id', transactionId)
            if (error) {
                console.log("m " + error.message);
            } else {
                console.log('feedback updated');
            }
        } catch (error) {
            console.log('Feedback update error', error);
        }
    }

    const getInputLangFromTranslateMode = () => {
        //if empty or null return empty string
        if (translateMode.length == 0) {
            return "";
        }
        //just split on the To and take the first part
        return translateMode.split("To")[0];
    }

    const getOutputLangFromTranslateMode = () => {
        //if empty or null return empty string
        if (translateMode.length == 0) {
            return "";
        }
        //just split on the To and take the second part
        return translateMode.split("To")[1];
    }

    const updateTranslateMode = (option: Option | null) => {
        if (option) {
            console.log("updateTranslateMode called with " + option.value);
            setTranslateMode(option.value);
            // if the input is not empty, enable the submit button
            if (inputValue.length > 0) {
                setSubmitBtnEnabled(true);
                setSubmitBtnVisible(true);
                setSubmitBtnText("Translate");
            }
        } //ending the if (option) statement
    }

    const handleModelConfigChange = (option: Option | null) => {
        if (option) {
            console.log("handleModelConfigChange called with " + option.value);
            setModelConfigId(option.idx);
        }
    }

    const handleInputChange = (value: string) => {
        setInputValue(value);  // Update inputValue to keep textarea in sync

        // Dealing with enabling UI based on input
        if (value.length > 0 && translateMode.length > 0) {
            setSubmitBtnEnabled(true);
            setSubmitBtnVisible(true);
            setSubmitBtnText("Translate");
        } else {
            setSubmitBtnEnabled(false);
            setSubmitBtnVisible(false);
        }
    };

    const handleClear = () => {
        setInputValue("");
        setResults("Results will appear here.");
        setTransactionId("");
        setSubmitBtnEnabled(false);
        setSubmitBtnVisible(false);
        setFeedbackEnabled(false);
        setSelectedVote(null);
        setClipboardBtnText("Copy to Clipboard");
        setShowResetButton(false);
    };

    const handleClippy = (value: string) => {
        navigator.clipboard.writeText(value);
        //write a clipboard icon to the clipboard button text
        setClipboardBtnText("Copied. 📋");
    };

    const handleReset = () => {
        setResults("Results will appear here.");
        setInputValue("");
        //leaving the language selector and model selector alone. people probably want to use the same one. should we leave the input?
        setTransactionId("");
        setSubmitBtnEnabled(false);
        setSubmitBtnVisible(false);
        setFeedbackEnabled(false);
        setSelectedVote(null);
        setShowResetButton(false);
        setClipboardBtnText("Copy to Clipboard");
        if (window.scrollY > 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // const disableLanguageSelect = (disable: boolean) => {
    //     if (disable) {
    //         document.getElementById("languageSelector")!.setAttribute("disabled", "true");
    //     } else {
    //         document.getElementById("languageSelector")!.removeAttribute("disabled");
    //     }
    // };

    const handleUpvote = () => {
        setSelectedVote('upvote');
        setShowFeedbackModal(true);
    }

    const handleDownvote = () => {
        setSelectedVote('downvote');
        setShowFeedbackModal(true);
    };

    const handleCancel = () => {
        setSelectedVote(null);
        setShowFeedbackModal(false);
        // Probably do nothing else?
    }

    const handleFeedbackSubmit = (feedback: string) => {
        if (selectedVote && transactionId) {
            updateTranslationWithFeedback(selectedVote, feedback, transactionId);
        }
        // if not, we'll just squelch the feedback since something isn't right anyway.
        setShowFeedbackModal(false);
        setFeedbackEnabled(false);
    };

    let firstMessage = false; //just a flag to announce to us that we have to scroll down.

    const submitHandler = useCallback(
        async (e: FormEvent) => {
            console.log('modelConfigId: ' + modelConfigId + ' translateMode: ' + translateMode);
            e.preventDefault();
            console.log('in event');

            // Prevent multiple submissions.
            if (inflight) return;

            // Reset results
            setInflight(true);
            setSubmitBtnText("Processing..");
            setResults("");
            setShowResetButton(false);

            // Handle inflght-ness
            setClipboardBtnText("Copy to Clipboard");
            setSubmitBtnEnabled(false);
            //    disableLanguageSelect(true);

            try {
                if (modelConfigId != 2) {
                    //determine which translateMode we are in by reading the radio button value
                    await fetchEventSource('/api/translate', {
                        method: 'POST',
                        body: JSON.stringify({ translateMode: translateMode, input: inputValue, modelConfigId: modelConfigId }), //modelConfig is hard-coded for now
                        headers: { 'Content-Type': 'application/json' },
                        onmessage(ev) {
                            //this is a hack to deal with https://github.com/Azure/fetch-event-source/issues/50
                            //if message is empty and it is not the firstMessage
                            if (ev.data.length == 0 && firstMessage) {
                                setResults((r) => r + "\n");
                            } else {
                                setResults((r) => r + ev.data);
                            }
                            if (!firstMessage) {
                                firstMessage = true;
                                //scroll the results area to the bottom
                                const resultsPane = document.getElementById("resultsPane")!;
                                if (window.innerWidth < 768) { // the tailwind md breakpoint
                                    resultsPane.scrollIntoView({ behavior: "smooth" });
                                }
                            }
                        }
                    });
                } else { // special processing for llama 2 70B model for now
                    const response = await fetch('/api/translate', {
                        method: 'POST',
                        body: JSON.stringify({ translateMode: translateMode, input: inputValue, modelConfigId: modelConfigId }), //modelConfig is hard-coded for now
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const reader = response.body!.getReader();
                    const decoder = new TextDecoder();
                    let resultsText = "";
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            break;
                        }
                        resultsText += decoder.decode(value);
                        if (!firstMessage) {
                            firstMessage = true;
                            //scroll the results area to the bottom
                            const resultsPane = document.getElementById("resultsPane")!;
                            if (window.innerWidth < 768) { // the tailwind md breakpoint
                                resultsPane.scrollIntoView({ behavior: "smooth" });
                            }
                        }
                    }
                    setResults(resultsText);
                }
                // get the inner text of the resultsTextArea and write it to the database.
                //note that there should be a better stateful way to do this.
                const resultsText = document.getElementById("resultsTextArea")!.innerText;
                const tId = await writeTranslationToDb(resultsText);
                console.log('transactionId: ' + tId);
                setTransactionId(tId);
                setSelectedVote(null); // clear the vote
                setFeedbackEnabled(true);
            } catch (error) {
                console.error(error);
                const resultsPane = document.getElementById("resultsPane")!;
                if (window.innerWidth < 768) { // the tailwind md breakpoint
                    resultsPane.scrollIntoView({ behavior: "smooth" });
                }
                setResults("An error has occurred. Please try again. Error: " + error + ".");
            } finally {
                setInflight(false);
                setSubmitBtnText("Translate");
                setSubmitBtnEnabled(true);
                firstMessage = false;
                setShowResetButton(true);
                //    disableLanguageSelect(false);
            }
        },
        [inputValue, inflight, modelConfigId, translateMode, feedbackEnabled, selectedVote, clipboardBtnText, results, transactionId, submitBtnText, submitBtnVisible] //ending the useCallback statement
    );

    return (
        <Container className="pt-0 md:pt-8 md:mb-20">
            <form onSubmit={submitHandler}>
                {/* Row for all of the controls and operations */}
                <div className="flex flex-wrap lg:flex-nowrap justify-center align-start gap-4 h-5/6">
                    {/* All right, we now start on the left side with a half-width column containing a control strip at the top and a text area below. */}
                    <div id="inputPane" className="input-pane">
                        {/* Here is the control strip */}
                        <div className="control-strip">
                            {/* Here is the toggle switch to select the direction of translation. (English to Samoan or Samoan to English) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                <div className="lg:mb-0 col-span-1 lg:col-span-2 ">
                                    <Select
                                        theme={(theme) => ({
                                            ...theme,
                                            borderRadius: 0,
                                            colors: {
                                                ...theme.colors,
                                                primary25: '#93c5fd',
                                                primary: '#3b82f6',
                                            },
                                        })}
                                        classNamePrefix="react-select-translate"
                                        placeholder="To start, select languages here..."
                                        options={languageOptions}
                                        // defaultValue={translateOptions[0]}
                                        onChange={(e) => updateTranslateMode(e)}
                                    />
                                </div>
                                {/* // Here is the button to clear the text area. */}
                                <div className="mt-2 lg:mt-0 flex justify-end col-span-1 gap-1">
                                    {/* // Here is the button to submit the text area. */}
                                    <button
                                        className={`control-strip-item ${!submitBtnVisible ? 'hidden' : ''}`}
                                        disabled={!submitBtnEnabled}
                                        id="btnSubmit"
                                        type="submit"
                                    >
                                        {submitBtnText}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* // Here is the text area with a placeholder communicating the maximum number of tokens (let's just say 2000 Characters) allowed. */}
                        <div className="relative text-input-container">
                            <textarea
                                id="textInputArea"
                                value={inputValue}
                                className="text-input-area"
                                placeholder="Enter text to be translated (up to 2000 characters) here."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { // Check for "Enter" key press and also ensure "Shift" is not held down
                                        e.preventDefault(); // Prevent the default "Enter" key action
                                        // check if we have a language selected and text in the input area
                                        if (translateMode.length > 0 && inputValue.length > 0) {
                                            submitHandler(e as unknown as FormEvent); // Manually trigger the form submission
                                        }
                                    }
                                }}
                                onChange={(e) => handleInputChange(e.target.value)}
                            />
                            <button
                                className="absolute top-2 right-2 bg-transparent hover:bg-gray-200 p-2 rounded-md"
                                id="btnClear"
                                type="reset"
                                onClick={handleClear}
                            >
                                <svg
                                    className="h-5 w-5 text-gray-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                    {/* // Now we move to the right side with a half-width column containing a control strip at the top and the results pane below. */}
                    <div id="resultsPane" className="results-pane">
                        {/* // Here is the control strip */}
                        <div className="control-strip">
                            <div className="grid grid-cols-3">
                                {/* // Here is the button to copy the results pane to the clipboard. */}
                                <div className="col-span-2 ">
                                    <button type="button" className="control-strip-item" id="btnCopy"
                                        onClick={(e) => handleClippy(results)}>{clipboardBtnText}</button>
                                </div>
                                {/* // Here is the thumbs up button. */}
                                <div className="flex justify-end col-span-1 gap-1">
                                    <div>
                                        {/* Upvote Button */}
                                        <button
                                            type="button"
                                            className={`vote-btn bg-transparent p-2 rounded-md hover:bg-gray-200 ${(!feedbackEnabled && selectedVote !== 'upvote') || (feedbackEnabled && selectedVote === 'downvote') ? 'hidden' : ''} ${!feedbackEnabled && selectedVote === 'upvote' ? 'bg-gray-200' : ''}`}
                                            disabled={(!feedbackEnabled && selectedVote === 'upvote') || (!feedbackEnabled && !selectedVote) ? true : undefined}
                                            id="btnUpvote"
                                            onClick={handleUpvote}
                                        >
                                            <svg
                                                className={`h-5 w-5 ${selectedVote === 'upvote' ? 'text-gray-500' : 'text-gray-700'}`}
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"
                                                />                                            </svg>
                                        </button>
                                        {/* Downvote Button */}
                                        <button
                                            type="button"
                                            className={`vote-btn bg-transparent p-2 rounded-md hover:bg-gray-200 ${(!feedbackEnabled && selectedVote !== 'downvote') || (feedbackEnabled && selectedVote === 'upvote') ? 'hidden' : ''} ${!feedbackEnabled && selectedVote === 'downvote' ? 'bg-gray-200' : ''}`}
                                            disabled={(!feedbackEnabled && selectedVote === 'downvote') || (!feedbackEnabled && !selectedVote) ? true : undefined}
                                            id="btnDownvote"
                                            onClick={handleDownvote}
                                        >
                                            <svg
                                                className={`h-5 w-5 ${selectedVote === 'downvote' ? 'text-gray-500' : 'text-gray-700'}`}
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* // Here is the results pane. It's a div with a preformatted text area inside. It will scroll if the text is too long. */}
                        <div className="results-container">
                            <pre id="resultsTextArea" className="results-text-area whitespace-pre-wrap">{results}</pre>
                        </div>
                        {/* // Here is the reset button, visible only when there are results. */}
                        <div className={`flex justify-end mt-5 ${!showResetButton ? 'hidden' : ''}`}>
                            <button
                                type="button"
                                className="control-strip-item"
                                id="btnReset"
                                onClick={handleReset}
                            > Reset </button>
                        </div>
                    </div>
                </div>
                {/* We have a hideable technical options section in a new row next, which is a collapsed div with an unhide-button */}
                <hr className="mt-10 border-sky-700 dark:border-gray-100"></hr>
                <div className="technical-options flex justify-center mt-5">
                    <div className="grid grid-rows-2">
                        <div className="row flex justify-center">
                            <h2 className="justify-center mt-5 md:mb-2 font-bold font-mono">Technical Details</h2>
                        </div>
                        <div className="row md:flex md:items-center gap-10 justify-evenly">
                            <div className="model-select justify-center">
                                {/* model selector dropdown with the two hardcoded options for now */}
                                <Select
                                    theme={(theme) => ({
                                        ...theme,
                                        borderRadius: 0,
                                        colors: {
                                            ...theme.colors,
                                            primary25: '#93c5fd',
                                            primary: '#3b82f6',
                                        },
                                    })}
                                    classNamePrefix="react-select-model"
                                    options={modelOptions}
                                    defaultValue={modelOptions[0]}
                                    onChange={(e) => handleModelConfigChange(e)}
                                />
                            </div>
                            <div className="pt-2 lg:pt-0 md:w-1/2 justify-center">
                                <div className="text-sm flex justify-center font-mono">Application version {APP_VERSION}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr className="mt-10 border-sky-700 dark:border-gray-100"></hr>
                <Feedback
                    show={showFeedbackModal}
                    onClose={() => setShowFeedbackModal(false)}
                    onSubmit={handleFeedbackSubmit}
                    onCancel={handleCancel}
                    feedbackVote={selectedVote!}
                />
            </form>
        </Container>
    );
}





