import React, { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { io } from "socket.io-client";
import {
  Send,
  User,
  Plus,
  X,
  Search,
  MessageCircle,
  Check,
  Clock,
  LogOut,
} from "lucide-react";
import { api } from "../services/api";
import { jwtDecode } from "jwt-decode";

import { useNavigate } from "react-router-dom";

// Initialize socket outside the component
const socket = io("https://edutalk-by8w.onrender.com");

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  state?: string; // Add state property for message status
}

interface Conversation {
  id: string;
  name: string;
  last_message?: string;
  participants: {
    id: string;
    name: string;
  }[];
}

interface DecodedToken {
  id: string;
  email: string;
  type: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Nuevos estados para el modal y los usuarios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Estados para la funcionalidad de búsqueda
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [searchResultIndex, setSearchResultIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [conversationUsers, setConversationUsers] = useState<User[]>([]);

  const [conversationSearchQuery, setConversationSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<
    Conversation[]
  >([]);

  const [conversationLastMessages, setConversationLastMessages] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(
          `https://edutalk-by8w.onrender.com/api/message/conversation/${selectedConversation}`
        );
        if (Array.isArray(response.data)) {
          // Mark messages from other users as seen when we load them
          const messagesData = response.data;
          setMessages(messagesData);

          // Store the last message for this conversation
          if (messagesData.length > 0) {
            setConversationLastMessages((prev) => ({
              ...prev,
              [selectedConversation]:
                messagesData[messagesData.length - 1].content,
            }));
          }

          // Find messages that are from other users and are "Unread"
          const unreadMessages = messagesData.filter(
            (msg) => msg.sender_id !== userId && msg.state === "Unread"
          );

          // Update these messages to "Seen"
          unreadMessages.forEach((msg) => {
            updateMessageState(msg.id, "Seen");
          });

          // Reset search when changing conversations
          setIsSearchOpen(false);
          setSearchQuery("");
          setFilteredMessages([]);
        } else {
          console.error("Unexpected messages format:", response.data);
          setError("Received invalid message data format from server.");
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages. Please try again.");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Rest of the socket code...
  }, [selectedConversation, userId]);

  useEffect(() => {
    if (conversationSearchQuery.trim() === "") {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter((conv) => {
        const otherParticipantName =
          getOtherParticipant(conv)?.toLowerCase() || "";
        return otherParticipantName.includes(
          conversationSearchQuery.toLowerCase()
        );
      });
      setFilteredConversations(filtered);
    }
  }, [conversationSearchQuery, conversations]);

  // Handle auth and fetch conversations
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setUserId(decoded.id);
      // Now we have the userId, we can fetch conversations
      fetchConversations(decoded.id);
      fetchUsersWithConversation(decoded.id);
    } catch (err) {
      console.error("Error decoding token:", err);
      navigate("/login");
    }
  }, [token, navigate]);

  const findUserForConversation = (conversationId: string) => {
    const conversationIndex = conversations.findIndex(
      (conv) => conv.id === conversationId
    );
    if (
      conversationIndex >= 0 &&
      conversationIndex < conversationUsers.length
    ) {
      return conversationUsers[conversationIndex].name;
    }

    return "Unknown User";
  };

  const fetchUsersWithConversation = async (userId: string) => {
    try {
      const usersResponse = await api.get(
        `https://edutalk-by8w.onrender.com/api/user/with-conversation/${userId}`
      );
      if (Array.isArray(usersResponse.data)) {
        setConversationUsers(usersResponse.data);
      } else {
        console.error("Unexpected users format:", usersResponse.data);
      }
    } catch (err) {
      console.error("Error fetching users with conversation:", err);
      setError("Failed to load user information. Please try again.");
    }
  };

  const fetchConversations = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      // Modified to use the user-specific endpoint
      const response = await api.get(
        `https://edutalk-by8w.onrender.com/api/conversation/user/${userId}`
      );
      // Ensure the response data is properly formatted
      if (Array.isArray(response.data)) {
        setConversations(response.data);
        setFilteredConversations(response.data); // Set filtered conversations too
      } else {
        console.error("Unexpected response format:", response.data);
        setError("Received invalid data format from server.");
        setConversations([]);
        setFilteredConversations([]);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to load conversations. Please try again.");
      setConversations([]);
      setFilteredConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener usuarios sin conversación
  const fetchAvailableUsers = async () => {
    if (!userId) return;

    try {
      setLoadingUsers(true);
      // Asegúrate de que la ruta sea correcta según tu API
      const response = await api.get(
        `https://edutalk-by8w.onrender.com/api/user/without-conversation/${userId}`
      );
      if (Array.isArray(response.data)) {
        // Filtrar explícitamente cualquier usuario que tenga el mismo ID que el usuario actual
        const filteredUsers = response.data.filter(
          (user) => user.id !== userId
        );
        setAvailableUsers(filteredUsers);

        if (response.data.length > 0 && filteredUsers.length === 0) {
          setError("No hay usuarios disponibles excepto tú mismo");
        }
      } else {
        console.error("Unexpected users format:", response.data);
        setAvailableUsers([]);
      }
    } catch (err) {
      console.error("Error fetching available users:", err);
      setError("No se pudieron cargar los usuarios disponibles.");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Abrir modal y cargar usuarios
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setError(null); // Limpiar errores previos
    fetchAvailableUsers();
  };

  // Crear nueva conversación
  const createConversation = async (otherUserId: string) => {
    // Validar que los IDs sean diferentes
    if (otherUserId === userId) {
      setError("No puedes crear una conversación contigo mismo");
      return;
    }

    try {
      // Verificar que realmente estamos enviando diferentes IDs
      console.log("Creating conversation between:", userId, "and", otherUserId);

      // Enviar los IDs según la estructura del modelo de datos en el backend
      const response = await api.post(
        "https://edutalk-by8w.onrender.com/api/conversation",
        {
          participant_one_id: userId, // Usuario logueado
          participant_two_id: otherUserId, // Usuario seleccionado
        }
      );

      // Cerrar el modal
      setIsModalOpen(false);

      // Actualizar la lista de conversaciones
      fetchConversations(userId);
      fetchUsersWithConversation(userId);

      // Seleccionar la nueva conversación
      if (response.data && response.data.id) {
        setSelectedConversation(response.data.id);
      }
    } catch (err: any) {
      console.error("Error creating conversation:", err);
      // Mostrar el mensaje de error del backend si está disponible
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Error al crear la conversación. Por favor intenta de nuevo.");
      }
    }
  };

  // Function to update message state
  const updateMessageState = async (messageId: string, newState: string) => {
    try {
      await api.patch(
        `https://edutalk-by8w.onrender.com/api/message/state/${messageId}`,
        {
          state: newState,
        }
      );

      // Update the message state locally
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, state: newState } : msg
        )
      );

      // Emit socket event to notify other users of state change
      socket.emit("chat.message.state", {
        message_id: messageId,
        state: newState,
        conversation_id: selectedConversation,
      });
    } catch (err) {
      console.error("Error updating message state:", err);

      // We don't set the error state here to avoid disrupting the UI for state updates
    }
  };

  // Handle message fetching and socket subscription
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(
          `https://edutalk-by8w.onrender.com/api/message/conversation/${selectedConversation}`
        );
        if (Array.isArray(response.data)) {
          // Mark messages from other users as seen when we load them
          const messagesData = response.data;
          setMessages(messagesData);

          // Find messages that are from other users and are "Unread"
          const unreadMessages = messagesData.filter(
            (msg) => msg.sender_id !== userId && msg.state === "Unread"
          );

          // Update these messages to "Seen"
          unreadMessages.forEach((msg) => {
            updateMessageState(msg.id, "Seen");
          });

          // Reset search when changing conversations
          setIsSearchOpen(false);
          setSearchQuery("");
          setFilteredMessages([]);
        } else {
          console.error("Unexpected messages format:", response.data);
          setError("Received invalid message data format from server.");
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages. Please try again.");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up socket listener for the selected conversation
    const channelName = `chat.conversation.${selectedConversation}`;

    // Message handler function
    const handleNewMessage = (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);

      // If the message is from another user, mark it as seen
      if (message.sender_id !== userId) {
        updateMessageState(message.id, "Seen");
      }
    };

    // Message state update handler
    const handleMessageStateUpdate = (data: {
      message_id: string;
      state: string;
    }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === data.message_id ? { ...msg, state: data.state } : msg
        )
      );
    };

    // Subscribe to the socket channels
    socket.on(channelName, handleNewMessage);
    socket.on("chat.message.state", handleMessageStateUpdate);

    // Cleanup function
    return () => {
      socket.off(channelName);
      socket.off("chat.message.state");
    };
  }, [selectedConversation, userId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (!isSearchOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSearchOpen]);

  // Filtrar mensajes cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery) {
      const results = messages.filter((message) =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(results);
      setSearchResultIndex(0);

      // Scroll al primer resultado si hay resultados
      if (results.length > 0) {
        const messageElement = document.getElementById(
          `message-${results[0].id}`
        );
        messageElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setFilteredMessages([]);
    }
  }, [searchQuery, messages]);

  // Enfocar automáticamente el campo de búsqueda al abrir
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedConversation) {
      try {
        setError(null);
        // Send message with initial state "Pending"
        const response = await api.post(
          "https://edutalk-by8w.onrender.com/api/message",
          {
            conversation_id: selectedConversation,
            content: newMessage,
            sender_id: userId,
            state: "Pending", // Set initial state to Pending
          }
        );

        // Update last message for this conversation
        setConversationLastMessages((prev) => ({
          ...prev,
          [selectedConversation]: newMessage,
        }));

        // Clear input field
        setNewMessage("");

        // If the message was successfully sent, update its state to "Unread"
        if (response.data && response.data.id) {
          // Wait a bit to simulate network delay (optional)
          setTimeout(() => {
            updateMessageState(response.data.id, "Unread");
          }, 500);
        }

        // Emit socket event with the initial pending state
        socket.emit("chat.message", {
          conversation_id: selectedConversation,
          content: newMessage,
          sender_id: userId,
          state: "Pending",
        });
      } catch (err) {
        console.error("Error sending message:", err);
        setError("Failed to send message. Please try again.");
      }
    }
  };

  // Render message status indicator based on state
  const renderMessageStatus = (message: Message) => {
    // Only show status for messages sent by the current user
    if (message.sender_id !== userId) return null;

    switch (message.state) {
      case "Seen":
        return (
          <div className="flex justify-end mt-1">
            <div className="flex text-blue-500">
              <Check size={12} className="ml-0" />
              <Check size={12} className="-ml-1" />
            </div>
          </div>
        );
      case "Unread":
        return (
          <div className="flex justify-end mt-1">
            <div className="flex text-gray-400">
              <Check size={12} className="ml-0" />
              <Check size={12} className="-ml-1" />
            </div>
          </div>
        );
      case "Pending":
        return (
          <div className="flex justify-end mt-1">
            <Clock size={12} className="text-gray-400" />
          </div>
        );
      default:
        return null;
    }
  };

  // Safe function to get the other participant's name
  const getOtherParticipant = (conversation: Conversation) => {
    return findUserForConversation(conversation.id);
  };

  // Function to retry loading conversations
  const handleRetryFetch = () => {
    if (userId) {
      fetchConversations(userId);
    }
  };

  // Función para abrir/cerrar el buscador
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Al abrir el buscador, reiniciar la búsqueda
      setSearchQuery("");
      setFilteredMessages([]);
    }
  };

  // Función para navegar a través de los resultados de búsqueda
  const navigateSearchResults = (direction: "next" | "prev") => {
    if (filteredMessages.length === 0) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (searchResultIndex + 1) % filteredMessages.length;
    } else {
      newIndex =
        (searchResultIndex - 1 + filteredMessages.length) %
        filteredMessages.length;
    }

    setSearchResultIndex(newIndex);

    // Scroll al mensaje seleccionado
    const messageElement = document.getElementById(
      `message-${filteredMessages[newIndex].id}`
    );
    messageElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Función para resaltar la parte del texto que coincide con la búsqueda
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="text-gray-900 bg-yellow-300">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-purple-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-purple-200">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Conversations List */}
      <div className="w-1/4 bg-gray-800 border-r border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-white">Conversaciones</h2>
            <button
              onClick={() => {
                // Logout logic - using empty string instead of null
                useAuthStore.getState().setToken("");
                navigate("/login");
              }}
              className="p-2 ml-2 text-white transition-colors duration-200 bg-red-600 rounded-full hover:bg-red-700"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Add search bar for conversations */}
        <div className="p-2 border-b border-gray-700">
          <div className="flex items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={conversationSearchQuery}
                onChange={(e) => setConversationSearchQuery(e.target.value)}
                placeholder="Buscar conversaciones..."
                className="w-full p-2 pl-8 text-sm text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500"
              />
              <Search className="absolute top-0 left-0 w-4 h-4 mt-3 ml-2 text-gray-400" />
              {conversationSearchQuery && (
                <button
                  onClick={() => setConversationSearchQuery("")}
                  className="absolute top-0 right-0 mt-2 mr-2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={handleOpenModal}
              className="p-2 ml-2 text-white transition-colors duration-200 bg-purple-600 rounded-full hover:bg-purple-700"
              title="Nueva Conversación"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-8rem)]">
          {" "}
          {/* Adjusted height to account for search bar */}
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
              {conversationSearchQuery ? (
                <>
                  <Search size={48} className="mb-4 text-purple-400" />
                  <p className="mb-4">No se encontraron resultados</p>
                  <button
                    onClick={() => setConversationSearchQuery("")}
                    className="px-4 py-2 text-white transition-colors duration-200 bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Limpiar búsqueda
                  </button>
                </>
              ) : (
                <>
                  <MessageCircle size={48} className="mb-4 text-purple-400" />
                  <p className="mb-4">No tienes conversaciones aún</p>
                  <button
                    onClick={handleOpenModal}
                    className="px-4 py-2 text-white transition-colors duration-200 bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Crear conversación
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors duration-200 ${
                  selectedConversation === conv.id
                    ? "bg-gray-700 border-l-4 border-l-purple-500"
                    : ""
                }`}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-white">
                      {getOtherParticipant(conv)}
                    </p>
                    {/* Fix the "Sin mensajes" issue by checking if messages exist for this conversation */}
                    <p className="text-sm text-gray-400 truncate">
                      {conversationLastMessages[conv.id] ||
                        conv.last_message ||
                        "Sin mensajes"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1 bg-gray-900">
        {selectedConversation ? (
          <>
            {/* Chat Header with Search Button */}
            <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-white">
                  {conversations.find((c) => c.id === selectedConversation)
                    ? getOtherParticipant(
                        conversations.find(
                          (c) => c.id === selectedConversation
                        )!
                      )
                    : "Chat"}
                </h3>
              </div>
              <button
                onClick={toggleSearch}
                className={`p-2 rounded-full ${
                  isSearchOpen
                    ? "bg-purple-900 text-purple-200"
                    : "text-gray-300 hover:bg-gray-700"
                } transition-colors duration-200`}
                title="Buscar en la conversación"
              >
                <Search size={20} />
              </button>
            </div>

            {/* Search Bar (visible when search is open) */}
            {isSearchOpen && (
              <div className="p-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar en la conversación..."
                      className="w-full p-2 pl-10 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500"
                    />
                    <Search className="absolute top-0 left-0 w-5 h-5 mt-3 ml-3 text-gray-400" />
                  </div>
                  <div className="flex ml-2">
                    <button
                      onClick={() => navigateSearchResults("prev")}
                      disabled={filteredMessages.length === 0}
                      className="p-2 text-gray-300 transition-colors duration-200 bg-gray-700 rounded-l hover:bg-gray-600 disabled:opacity-50"
                      title="Resultado anterior"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => navigateSearchResults("next")}
                      disabled={filteredMessages.length === 0}
                      className="p-2 text-gray-300 transition-colors duration-200 bg-gray-700 rounded-r hover:bg-gray-600 disabled:opacity-50"
                      title="Siguiente resultado"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    onClick={toggleSearch}
                    className="p-2 ml-2 text-gray-300 transition-colors duration-200 bg-gray-700 rounded hover:bg-gray-600"
                    title="Cerrar búsqueda"
                  >
                    <X size={20} />
                  </button>
                </div>
                {searchQuery && (
                  <div className="mt-1 text-sm text-gray-400">
                    {filteredMessages.length}{" "}
                    {filteredMessages.length === 1 ? "resultado" : "resultados"}
                    {filteredMessages.length > 0 &&
                      ` (${searchResultIndex + 1}/${filteredMessages.length})`}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800">
              {error && (
                <div className="px-4 py-3 mb-4 text-red-300 bg-red-900 border border-red-800 rounded">
                  {error}
                </div>
              )}
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">
                    No hay mensajes aún. ¡Inicia la conversación!
                  </p>
                </div>
              ) : (
                messages.map((message, index) => {
                  // Determinar si este mensaje está en los resultados de búsqueda
                  const isSearchResult =
                    searchQuery &&
                    message.content
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase());
                  const isCurrentSearchResult =
                    isSearchResult &&
                    filteredMessages[searchResultIndex]?.id === message.id;

                  // Determinar si el mensaje fue enviado por el usuario actual
                  const isSentByCurrentUser = message.sender_id === userId;

                  return (
                    <div
                      id={`message-${message.id}`}
                      key={message.id || index}
                      className={`flex flex-col mb-4 ${
                        isSentByCurrentUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 
                          ${
                            isCurrentSearchResult
                              ? "ring-2 ring-yellow-500"
                              : ""
                          } 
                          ${
                            isSentByCurrentUser
                              ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                              : "bg-gray-700 text-gray-200"
                          }`}
                      >
                        {searchQuery
                          ? highlightText(message.content, searchQuery)
                          : message.content}
                      </div>

                      {/* Message status indicators */}
                      {renderMessageStatus(message)}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-gray-800 border-t border-gray-700"
            >
              <div className="flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 p-2 text-white bg-gray-700 border border-gray-600 rounded-l-lg focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="p-2 text-white transition-colors duration-200 rounded-r-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                  disabled={!newMessage.trim()}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
            <MessageCircle size={64} className="mb-4 text-purple-400" />
            <p className="mb-4 text-lg text-gray-300">
              Selecciona una conversación para empezar a chatear
            </p>
            {conversations.length === 0 && (
              <button
                onClick={handleOpenModal}
                className="px-4 py-2 mt-2 text-white transition-colors duration-200 bg-purple-600 rounded-md hover:bg-purple-700"
              >
                Crear nueva conversación
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal para crear nueva conversación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="max-w-md bg-gray-800 border border-gray-700 rounded-lg shadow-lg w-96">
            <div className="flex items-center justify-between p-4 border-b border-gray-700 rounded-t-lg bg-gradient-to-r from-purple-900 to-gray-800">
              <h3 className="text-lg font-medium text-white">
                Nueva Conversación
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setError(null);
                }}
                className="text-gray-400 transition-colors duration-200 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-96">
              {error && (
                <div className="px-4 py-3 mb-4 text-red-300 bg-red-900 border border-red-800 rounded">
                  {error}
                </div>
              )}

              {loadingUsers ? (
                <div className="flex justify-center my-8">
                  <div className="w-8 h-8 border-b-2 border-purple-500 rounded-full animate-spin"></div>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="my-8 text-center text-gray-400">
                  <p>No hay usuarios disponibles</p>
                  <p className="mt-2 text-sm">
                    Todos los usuarios ya tienen una conversación contigo
                  </p>
                </div>
              ) : (
                <div>
                  <p className="mb-4 text-sm text-gray-400">
                    Selecciona un usuario para iniciar una conversación:
                  </p>
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center p-3 mb-2 transition-colors duration-200 bg-gray-700 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
                      onClick={() => createConversation(user.id)}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-800 border-t border-gray-700 rounded-b-lg">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setError(null);
                }}
                className="w-full p-2 text-white transition-colors duration-200 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
