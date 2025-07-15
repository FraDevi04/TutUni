'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageCircle, Send, Bot, User, Clock, FileText, Trash2, RefreshCw, Lightbulb } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ChatMessage {
  id: number
  content: string
  message_type: 'user' | 'ai' | 'system'
  created_at: string
  context_documents?: number[]
  ai_model?: string
  tokens_used?: number
  processing_time_ms?: number
  retrieved_chunks?: any[]
  confidence_score?: number
}

interface ChatHistoryResponse {
  messages: ChatMessage[]
  total_count: number
  has_more: boolean
}

interface ChatInterfaceProps {
  projectId: number
}

export function ChatInterface({ projectId }: ChatInterfaceProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projectId) {
      fetchChatHistory()
      fetchSuggestedQuestions()
    }
  }, [projectId])

  useEffect(() => {
    // Auto scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const fetchChatHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const response = await fetch(`/api/chat/projects/${projectId}/history`)
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento della cronologia')
      }
      
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching chat history:', error)
      toast.error('Errore nel caricamento della cronologia chat')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const fetchSuggestedQuestions = async () => {
    try {
      const response = await fetch(`/api/chat/projects/${projectId}/suggested-questions`)
      
      if (response.ok) {
        const data = await response.json()
        setSuggestedQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error fetching suggested questions:', error)
    }
  }

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !session?.user) return

    setIsLoading(true)
    const userMessage: ChatMessage = {
      id: Date.now(),
      content: messageContent,
      message_type: 'user',
      created_at: new Date().toISOString()
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      const response = await fetch(`/api/chat/projects/${projectId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Errore nell\'invio del messaggio')
      }

      const aiMessage = await response.json()
      setMessages(prev => [...prev, aiMessage])
      
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Errore nell\'invio del messaggio')
      
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage(input.trim())
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question)
  }

  const clearHistory = async () => {
    try {
      const response = await fetch(`/api/chat/projects/${projectId}/history`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages([])
        toast.success('Cronologia chat cancellata')
      }
    } catch (error) {
      toast.error('Errore nella cancellazione della cronologia')
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: it 
    })
  }

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.message_type === 'user'
    const Icon = isUser ? User : Bot
    
    return (
      <div key={message.id} className={`flex gap-3 p-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-900 border'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {/* AI Response Metadata */}
            {!isUser && (message.tokens_used || message.processing_time_ms || message.confidence_score) && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                <div className="flex flex-wrap gap-2">
                  {message.processing_time_ms && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {message.processing_time_ms}ms
                    </Badge>
                  )}
                  {message.tokens_used && (
                    <Badge variant="outline" className="text-xs">
                      {message.tokens_used} tokens
                    </Badge>
                  )}
                  {message.confidence_score && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(message.confidence_score * 100)}% fiducia
                    </Badge>
                  )}
                  {message.context_documents && message.context_documents.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {message.context_documents.length} doc
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : ''}`}>
            {formatTimestamp(message.created_at)}
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingHistory) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Chat AI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat AI
        </CardTitle>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchChatHistory}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {isLoadingHistory ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-20 flex-1 max-w-[80%]" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                Nessuna conversazione ancora. Inizia chiedendo qualcosa sui tuoi documenti!
              </p>
              
              {suggestedQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Domande suggerite
                  </p>
                  <div className="space-y-2">
                    {suggestedQuestions.slice(0, 3).map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full text-left h-auto py-2 px-3 text-wrap"
                        onClick={() => handleSuggestedQuestion(question)}
                        disabled={isLoading}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message.id || index} className={`flex gap-3 p-4 ${message.message_type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.message_type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  
                  <div className={`flex-1 ${message.message_type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                      message.message_type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900 border'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {/* AI Response Metadata */}
                      {message.message_type !== 'user' && (message.tokens_used || message.processing_time_ms || message.confidence_score) && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                          <div className="flex flex-wrap gap-2">
                            {message.processing_time_ms && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {message.processing_time_ms}ms
                              </Badge>
                            )}
                            {message.tokens_used && (
                              <Badge variant="outline" className="text-xs">
                                {message.tokens_used} tokens
                              </Badge>
                            )}
                            {message.confidence_score && (
                              <Badge variant="outline" className="text-xs">
                                {Math.round(message.confidence_score * 100)}% fiducia
                              </Badge>
                            )}
                            {message.context_documents && message.context_documents.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {message.context_documents.length} doc
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-xs text-gray-500 mt-1 ${message.message_type === 'user' ? 'text-right' : ''}`}>
                      {formatTimestamp(message.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Elaborazione in corso...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi la tua domanda sui documenti..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          {/* Suggested Questions */}
          {!isLoading && messages.length === 0 && suggestedQuestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedQuestions.slice(0, 2).map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto py-1.5 px-2 text-gray-600"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question.length > 40 ? `${question.slice(0, 40)}...` : question}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 