import { configureStore, createSlice } from '@reduxjs/toolkit';

const now = new Date();
const today = now.toISOString().split('T')[0];
const time = now.toTimeString().slice(0, 5);

const initialForm = {
  hcp_name: '',
  date: today,
  time: time,
  topics_discussed: '',
  materials_shared: '',
  samples_distributed: '',
  sentiment: 'Neutral',
  outcomes: '',
  follow_up_actions: '',
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState: {
    form: initialForm,
    savedId: null,
    isSaving: false,
    saveSuccess: false,
    interactions: [],
  },
  reducers: {
    updateForm: (state, action) => {
      state.form = { ...state.form, ...action.payload };
    },
    resetForm: (state) => {
      state.form = initialForm;
      state.savedId = null;
      state.saveSuccess = false;
    },
    setSavedId: (state, action) => {
      state.savedId = action.payload;
      state.saveSuccess = true;
    },
    setSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    setInteractions: (state, action) => {
      state.interactions = action.payload;
    },
  },
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    isLoading: false,
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const { updateForm, resetForm, setSavedId, setSaving, setInteractions } = interactionSlice.actions;
export const { addMessage, setLoading, clearMessages } = chatSlice.actions;

export const store = configureStore({
  reducer: {
    interaction: interactionSlice.reducer,
    chat: chatSlice.reducer,
  },
});
