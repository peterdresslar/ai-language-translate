'use client';
import Container from "./container";
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { FormEvent, useCallback, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Select from "react-select";

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
    const translateOptions: Option[] = [
        { idx: 0, value: 'englishToSamoan', label: 'English to Samoan' },
        { idx: 1, value: 'samoanToEnglish', label: 'Samoan to English' },
        { idx: 2, value: 'englishToChamorro', label: 'English to Chamorro' },
        { idx: 3, value: 'chamorroToEnglish', label: 'Chamorro to English' }
    ];
    const modelOptions: Option[] = [
        { idx: 0, value: 'gpt4', label: 'OpenAI GPT-4' },
        { idx: 1, value: 'gpt35', label: 'OpenAI GPT-3.5' },
        { idx: 2, value: 'llama270', label: 'Meta Llama 2 70B (fa\'atamala/slow)' }
    ];
    const [translateMode, setTranslateMode] = useState("");
    const [feedbackEnabled, setFeedbackEnabled] = useState(false);
    const [selectedVote, setSelectedVote] = useState<'upvote' | 'downvote' | null>(null);

    const [input, setInput] = useState("");
    const [clipboardBtnText, setClipboardBtnText] = useState("Copy to Clipboard");
    const [modelConfigId, setModelConfigId] = useState(modelOptions[0].idx); //default to the first model in the list
    const [userId, setUserId] = useState(1); // later we can add users

    const [inflight, setInflight] = useState(false);
    const [submitBtnVisible, setSubmitBtnVisible] = useState(false);
    const [submitBtnEnabled, setSubmitBtnEnabled] = useState(false);
    const [submitBtnText, setSubmitBtnText] = useState("Translate");
    const [results, setResults] = useState("Results will appear here.");
    const [transactionId, setTransactionId] = useState(""); //this id for translation will be used to assign the feedback to the correct translation record

    //useeffect to log states of submit button variables to the console
    useEffect(() => {
        console.log('submitBtnVisible: ' + submitBtnVisible + ' submitBtnEnabled: ' + submitBtnEnabled + ' submitBtnText: ' + submitBtnText);
    }, [submitBtnVisible, submitBtnEnabled, submitBtnText]);

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
                .insert({ user_id: userId, model_config: modelConfigId, prompt: input, source_lang: sourceLang, target_lang: targetLang, response: resultsText })
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

    const updateTranslationWithFeedback = async (feedback: String, transactionId: String) => {
        console.log("updating db with feedback " + feedback + " for transactionId " + transactionId);
        try {
            let { data, error } = await dbClient
                .from('translations')
                .update({ feedback_state: feedback })
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
            if (input.length > 0) {
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
        setInput(value);
        //enable btnSubmit if input is not empty and a language has been selected
        if (value.length > 0 && translateMode.length > 0) {
            setSubmitBtnEnabled(true);
            setSubmitBtnVisible(true);
            setSubmitBtnText("Translate");
        } else {
            setSubmitBtnEnabled(false);
            setSubmitBtnVisible(false);
        }
        //check if the btnSubmit is enabled
    };

    const handleClear = () => {
        setInput("");
        setResults("Results will appear here.");
        setTransactionId("");
        disableSubmitButton(true);
        setFeedbackEnabled(false);
        setClipboardBtnText("Copy to Clipboard");
    };

    const handleClippy = (value: string) => {
        navigator.clipboard.writeText(value);
        //write a clipboard icon to the clipboard button text
        setClipboardBtnText("Copied. 📋");
    };

    // const disableLanguageSelect = (disable: boolean) => {
    //     if (disable) {
    //         document.getElementById("languageSelector")!.setAttribute("disabled", "true");
    //     } else {
    //         document.getElementById("languageSelector")!.removeAttribute("disabled");
    //     }
    // };

    const handleUpvote = async () => {
        //disable the feedback buttons
        setSelectedVote('upvote');
        setFeedbackEnabled(false);
        //update the translation record with the feedback
        updateTranslationWithFeedback("upvote", transactionId);
    }


    const handleDownvote = async () => {
        //change the text of the feedback button
        setSelectedVote('downvote');
        setFeedbackEnabled(false);
        //update the translation record with the feedback
        updateTranslationWithFeedback("downvote", transactionId);
    };

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

            // Handle inflght-ness
            setClipboardBtnText("Copy to Clipboard");
            setSubmitBtnEnabled(false);
            //    disableLanguageSelect(true);

            try {
                console.log('streaming');

                if (modelConfigId != 2) {
                    //determine which translateMode we are in by reading the radio button value
                    await fetchEventSource('/api/translate', {
                        method: 'POST',
                        body: JSON.stringify({ translateMode: translateMode, input: input, modelConfigId: modelConfigId }), //modelConfig is hard-coded for now
                        headers: { 'Content-Type': 'application/json' },
                        onmessage(ev) {
                            setResults((r) => r + ev.data);
                        }
                    });
                } else { // special processing for llama 2 70B model for now
                    const response = await fetch('/api/translate', {
                        method: 'POST',
                        body: JSON.stringify({ translateMode: translateMode, input: input, modelConfigId: modelConfigId }), //modelConfig is hard-coded for now
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
                setResults("An error has occurred. Please try again. Error: " + error + ".");
            } finally {
                setInflight(false);
                setSubmitBtnText("Translate");
                setSubmitBtnEnabled(true);
                //    disableLanguageSelect(false);
            }
        },
        [input, inflight, modelConfigId, translateMode, feedbackEnabled, selectedVote, clipboardBtnText, results, transactionId, submitBtnText, submitBtnVisible] //ending the useCallback statement
    );

    return (
        <Container className="mb-20">
            <form onSubmit={submitHandler}>

                {/* Row for all of the controls and operations */}
                <div className="flex flex-wrap lg:flex-nowrap justify-center align-start gap-4 h-5/6">
                    {/* All right, we now start on the left side with a half-width column containing a control strip at the top and a text area below. */}

                    <div className="translate-pane-left">
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
                                        options={translateOptions}
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
                            <textarea id="textInputArea" className="text-input-area" placeholder="Enter text to be translated (up to 2000 characters) here."
                                onChange={(e) => handleInputChange(e.target.value)}>
                            </textarea>
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
                    <div className="translate-pane-right">
                        {/* // Here is the control strip */}
                        <div className="control-strip">
                            <div className="grid grid-cols-3">
                                {/* // Here is the button to copy the results pane to the clipboard. */}
                                <div className="col-span-2 ">
                                    <button className="control-strip-item" id="btnCopy"
                                        onClick={(e) => handleClippy(results)}>{clipboardBtnText}</button>
                                </div>
                                {/* // Here is the thumbs up button. */}
                                <div className="flex justify-end col-span-1 gap-1">
                                    <div>
                                        {/* Upvote Button */}
                                        <button
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
                            <pre id="resultsTextArea" className="results-text-area">{results}</pre>
                        </div>
                    </div>
                </div>
                {/* We have a hideable technical options section in a new row next, which is a collapsed div with an unhide-button */}
                <hr className="mt-10 border-sky-700 dark:border-gray-100"></hr>
                <div className="technical-options flex justify-center mt-5">
                    <div className="grid grid-rows-2">
                        <div className="row flex justify-center">
                            <h2 className="justify-center mb-5">Fa'amatalaga fa'apitoa <em>(Technical details)</em></h2>
                        </div>
                        <div className="row md:flex md:items-center gap-10 justify-center">
                            <div className="md:w-1/2">
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
                            <div className="md:w-1/2">
                                <pre className="text-sm">Application version 0.0.1</pre>
                            </div>
                        </div>
                    </div>
                </div>
                <hr className="mt-10 border-sky-700 dark:border-gray-100"></hr>
            </form>
        </Container>
    );
}





