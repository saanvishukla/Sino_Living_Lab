import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, X, Maximize2, Minimize2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your SmartDirectory AI assistant. How can I help you manage your tenants today?' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const lowerInput = input.toLowerCase()
    
    try {
      if (lowerInput.includes('add')) {
        // Add tenant logic
        const response = await fetch('http://localhost:3001/api/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unit: '5768',
            former_tenant___existing_tenant: 'John and Co.',
            new_tenant: 'Swire Co.',
            email: 'test@john.co',
            name: 'Swire Co.',
            floor: '57'
          })
        })
        const data = await response.json()
        
        const content = data.success 
          ? `Successfully added tenant "Swire Co." to unit 5768.`
          : `Failed to add tenant: ${data.error || 'Unknown error'}`
          
        setMessages(prev => [...prev, { role: 'assistant', content }])
      } 
      else if (lowerInput.includes('delete')) {
        // Delete tenant logic - First find the tenant ID for unit 5768
        const listResponse = await fetch('http://localhost:3001/api/tenants?unit=5768')
        const listData = await listResponse.json()
        
        if (listData.success && listData.data.length > 0) {
          const tenantId = listData.data[0].id
          const delResponse = await fetch(`http://localhost:3001/api/tenants/${tenantId}`, {
            method: 'DELETE'
          })
          const delData = await delResponse.json()
          
          const content = delData.success
            ? `Successfully deleted tenant in unit 5768.`
            : `Failed to delete tenant: ${delData.error || 'Unknown error'}`
          setMessages(prev => [...prev, { role: 'assistant', content }])
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Could not find any tenant in unit 5768 to delete.' }])
        }
      }
      else {
        // Generic demonstration response
        setTimeout(() => {
          const assistantMessage: Message = { 
            role: 'assistant', 
            content: `I've received your message: "${input}". This is a demonstration of the AI interface. You can say "add" to create a test tenant or "delete" to remove unit 5768.`
          }
          setMessages(prev => [...prev, assistantMessage])
          setIsLoading(false)
        }, 1000)
        return // Return early to avoid double setIsLoading(false)
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the directory service.' }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="px-4 mt-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 group"
        >
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Bot className="h-5 w-5" />
          </div>
          <span className="font-semibold">AI Assistant</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 ${isExpanded ? 'w-[500px] h-[700px]' : 'w-[380px] h-[500px]'}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">AI Assistant</h3>
            <p className="text-[10px] text-white/70">Powered by SmartDirectory AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-indigo-600' : 'bg-white border border-gray-200'}`}>
                {m.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-purple-600" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}`}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-purple-600 animate-pulse" />
              </div>
              <div className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm rounded-tl-none flex gap-1 items-center">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-2xl">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
