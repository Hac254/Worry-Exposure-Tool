'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, Clock, TrendingUp, Lightbulb, ArrowRight, ArrowLeft, Star, HelpCircle, Volume2, VolumeX } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"

type Session = {
  worry: string
  duration: number
  initialAnxiety: number
  finalAnxiety: number
  answers: string[]
  reflections: string[]
  timeSpent: number
}

type User = {
  name: string
  sessions: Session[]
}

const aiPrompts = [
  "Imagine the worst-case scenario happening. Where are you when you find out?",
  "How do you find out about this situation? What's the first thing you do after hearing the news?",
  "What do you feel in this moment? How does your body react?",
  "What thoughts are running through your mind?",
  "How do your loved ones respond to this situation?",
  "What's the most challenging part of this scenario for you?",
  "How does this situation affect your daily life?",
  "What's the long-term impact of this worst-case scenario?",
  "How do you see yourself coping with this situation?",
  "What resources or support do you have available in this scenario?",
]

const reflectionQuestions = [
  "How do you feel now compared to the beginning of the session?",
  "Did the worst-case scenario feel as bad as you expected it to?",
  "What did you learn about your ability to sit with the discomfort of this worry?",
  "Did you notice any changes in your physical sensations during the session?",
  "What strategies, if any, did you use to manage your anxiety during the exposure?",
]

const exampleWorries = [
  {
    worry: "Losing my job",
    solutions: [
      "Update your resume and LinkedIn profile",
      "Network within your industry",
      "Learn new skills to increase your value",
      "Create an emergency fund",
      "Explore alternative career options"
    ]
  },
  {
    worry: "Health concerns",
    solutions: [
      "Schedule regular check-ups with your doctor",
      "Adopt a healthy diet and exercise routine",
      "Practice stress-reduction techniques like meditation",
      "Get adequate sleep",
      "Stay informed about preventive care"
    ]
  },
  {
    worry: "Financial instability",
    solutions: [
      "Create a budget and stick to it",
      "Seek advice from a financial advisor",
      "Look for additional income sources",
      "Reduce unnecessary expenses",
      "Learn about investing and saving strategies"
    ]
  }
]

export default function WorryExposureTool() {
  const [user, setUser] = useState<User | null>(null)
  const [worry, setWorry] = useState('')
  const [duration, setDuration] = useState(1)
  const [stage, setStage] = useState<'splash' | 'input' | 'exposure' | 'exposure-rating' | 'reflection' | 'reflection-rating' | 'dashboard'>('splash')
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [initialAnxiety, setInitialAnxiety] = useState<number | null>(null)
  const [finalAnxiety, setFinalAnxiety] = useState<number | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [reflections, setReflections] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [showExamples, setShowExamples] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')

  useEffect(() => {
    const savedUser = localStorage.getItem('worryExposureUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    audioRef.current = new Audio('/background-music.mp3')
    audioRef.current.loop = true
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (stage === 'exposure' || stage === 'reflection') {
      timer = setInterval(() => {
        setTimeSpent(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [stage])

  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(error => console.log("Audio play failed:", error))
      }
    }
  }, [isMuted])

  const handleStartExposure = () => {
    setStage('exposure')
    setStartTime(Date.now())
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(error => console.log("Audio play failed:", error))
    }
  }

  const handleAnswer = () => {
    const newAnswers = [...answers, currentAnswer]
    setAnswers(newAnswers)
    setProgress((newAnswers.length / aiPrompts.length) * 100)
    setCurrentAnswer('') // Clear the current answer
    if (newAnswers.length === aiPrompts.length) {
      setStage('exposure-rating')
    } else {
      setCurrentPrompt(prev => prev + 1)
    }
  }

  const handleNextPrompt = () => {
    if (currentPrompt < aiPrompts.length - 1) {
      setCurrentPrompt(prev => prev + 1)
      setCurrentAnswer('') // Clear the current answer when moving to the next prompt
    } else {
      setStage('exposure-rating')
    }
  }

  const handlePreviousPrompt = () => {
    if (currentPrompt > 0) {
      setCurrentPrompt(prev => prev - 1)
      setCurrentAnswer(answers[currentPrompt - 1] || '') // Set the answer to the previous question
    } else {
      setStage('input')
    }
  }

  const handleReflectionSubmit = (reflection: string) => {
    const newReflections = [...reflections, reflection]
    setReflections(newReflections)
    setCurrentAnswer('') // Clear the current answer
    if (newReflections.length === reflectionQuestions.length) {
      setStage('reflection-rating')
    } else {
      setCurrentPrompt(prev => prev + 1)
    }
  }

  const saveSession = () => {
    const newSession: Session = {
      worry,
      duration,
      initialAnxiety: initialAnxiety || 0,
      finalAnxiety: finalAnxiety || 0,
      answers,
      reflections,
      timeSpent
    }
    const updatedUser = user ? {
      ...user,
      sessions: [...user.sessions, newSession]
    } : {
      name: 'User',
      sessions: [newSession]
    }
    setUser(updatedUser)
    localStorage.setItem('worryExposureUser', JSON.stringify(updatedUser))
    setStage('dashboard')
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const resetTool = () => {
    setWorry('')
    setDuration(1)
    setStage('input')
    setCurrentPrompt(0)
    setInitialAnxiety(null)
    setFinalAnxiety(null)
    setAnswers([])
    setReflections([])
    setProgress(0)
    setTimeSpent(0)
    setCurrentAnswer('')
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
            Worry Exposure Tool
          </CardTitle>
          <CardDescription className="text-lg">
            Face your worries, reduce your anxiety
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {stage === 'splash' && (
              <motion.div
                key="splash"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <h1 className="text-4xl font-bold mb-4">Welcome to the Worry Exposure Tool</h1>
                <p className="text-xl mb-8">Confront your worries and build resilience</p>
                <Button 
                  onClick={() => setStage('input')} 
                  className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full text-lg transition-all duration-300 transform hover:scale-105"
                >
                  Get Started
                </Button>
              </motion.div>
            )}
            {stage === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <label htmlFor="worry" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  What's worrying you today?
                </label>
                <Textarea
                  id="worry"
                  value={worry}
                  onChange={(e) => setWorry(e.target.value)}
                  placeholder="Describe your worry..."
                  className="w-full mb-4"
                />
                <div className="flex justify-between items-center mb-4">
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    How long would you like to focus on this worry?
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Choose a duration that feels challenging but manageable.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                  <SelectTrigger className="w-full mb-4">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="2">2 minutes</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Rate your current anxiety level:
                </label>
                <div className="flex items-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      variant={initialAnxiety === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInitialAnxiety(value)}
                      className={`w-10 h-10 rounded-full p-0 ${initialAnxiety === value ? 'bg-orange-500 text-white' : 'border-black'}`}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
                <Button 
                  onClick={handleStartExposure} 
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                  disabled={!worry || !duration || !initialAnxiety}
                >
                  Start Exposure Session
                </Button>
                <Button 
                  onClick={() => setShowExamples(!showExamples)} 
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {showExamples ? 'Hide' : 'Show'} Example Worries and Solutions
                </Button>
                {showExamples && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Example Worries and Solutions:</h3>
                    {exampleWorries.map((example, index) => (
                      <div key={index} className="mb-4">
                        <h4 className="font-medium">{example.worry}</h4>
                        <ul className="list-disc list-inside">
                          {example.solutions.map((solution, sIndex) => (
                            <li key={sIndex}>{solution}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {stage === 'exposure' && (
              <motion.div
                key="exposure"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y:  0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-4">
                  <Progress value={progress} className="w-full" />
                  <p className="text-center mt-2">
                    Question {currentPrompt + 1} of {aiPrompts.length}
                  </p>
                </div>
                <Card className="mb-4 bg-white dark:bg-gray-800">
                  <CardContent className="p-4">
                    <p className="text-lg mb-4">{aiPrompts[currentPrompt]}</p>
                    <Textarea
                      key={currentPrompt} // This key prop forces a re-render when the prompt changes
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full mb-4"
                    />
                  </CardContent>
                </Card>
                <div className="flex justify-between">
                  <Button onClick={handlePreviousPrompt} className="bg-gray-500 hover:bg-gray-600 text-white">
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button 
                    onClick={handleAnswer} 
                    className="bg-pink-500 hover:bg-pink-600 text-white" 
                    disabled={!currentAnswer}
                  >
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
            {stage === 'exposure-rating' && (
              <motion.div
                key="exposure-rating"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-semibold mb-4">Rate Your Anxiety</h3>
                <p className="mb-4">Now that you've gone through the exposure, how would you rate your anxiety?</p>
                <div className="flex items-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      variant={finalAnxiety === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFinalAnxiety(value)}
                      className={`w-10 h-10 rounded-full p-0 ${finalAnxiety === value ? 'bg-orange-500 text-white' : 'border-black'}`}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
                <Button 
                  onClick={() => {
                    setStage('reflection')
                    setCurrentPrompt(0)
                    setCurrentAnswer('')
                  }} 
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                  disabled={finalAnxiety === null}
                >
                  Continue to Reflection
                </Button>
              </motion.div>
            )}
            {stage === 'reflection' && (
              <motion.div
                key="reflection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-semibold mb-4">Reflection</h3>
                <Card className="mb-4 bg-white dark:bg-gray-800">
                  <CardContent className="p-4">
                    <p className="mb-4">{reflectionQuestions[currentPrompt]}</p>
                    <Textarea
                      key={`reflection-${currentPrompt}`} // This key prop forces a re-render when the prompt changes
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Your thoughts..."
                      className="w-full mb-4"
                    />
                  </CardContent>
                </Card>
                <div className="flex justify-between">
                  <Button onClick={() => currentPrompt > 0 ? setCurrentPrompt(prev => prev - 1) : setStage('exposure-rating')} className="bg-gray-500 hover:bg-gray-600 text-white">
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button 
                    onClick={() => handleReflectionSubmit(currentAnswer)} 
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                    disabled={!currentAnswer}
                  >
                    {currentPrompt < reflectionQuestions.length - 1 ? 'Next Question' : 'Complete Reflection'}
                  </Button>
                </div>
              </motion.div>
            )}
            {stage === 'reflection-rating' && (
              <motion.div
                key="reflection-rating"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-semibold mb-4">Final Anxiety Rating</h3>
                <p className="mb-4">After reflecting on your experience, how would you rate your anxiety now?</p>
                <div className="flex items-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      variant={finalAnxiety === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFinalAnxiety(value)}
                      className={`w-10 h-10 rounded-full p-0 ${finalAnxiety === value ? 'bg-orange-500 text-white' : 'border-black'}`}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
                <Button 
                  onClick={saveSession} 
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                  disabled={finalAnxiety === null}
                >
                  Complete Session
                </Button>
              </motion.div>
            )}
            {stage === 'dashboard' && user && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-semibold mb-4">Your Progress</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-purple-500 border-purple-500">
                      <Brain className="w-4 h-4 mr-2" /> Total Sessions: {user.sessions.length}
                    </Badge>
                    <Badge variant="outline" className="text-blue-500 border-blue-500">
                      <Clock className="w-4 h-4 mr-2" /> Total Time: {user.sessions.reduce((acc, session) => acc + session.timeSpent, 0)} seconds
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Recent Worries:</h4>
                    <ul className="list-disc list-inside">
                      {user.sessions.slice(-3).reverse().map((session, index) => (
                        <li key={index}>{session.worry}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Anxiety Trend:</h4>
                    <div className="h-20 flex items-end space-x-1">
                      {user.sessions.slice(-5).map((session, index) => {
                        const anxietyReduction = session.initialAnxiety - session.finalAnxiety
                        return (
                          <div
                            key={index}
                            className="bg-blue-500 w-1/5"
                            style={{ height: `${anxietyReduction * 20}%` }}
                            title={`Session ${index + 1}: ${anxietyReduction}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
                <Button onClick={resetTool} className="w-full mt-4 bg-pink-500 hover:bg-pink-600 text-white">
                  Start New Session
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="justify-between">
          <Badge variant="outline" className="text-indigo-500 border-indigo-500">
            <Lightbulb className="w-4 h-4 mr-2" /> Worry Exposure
          </Badge>
          <Badge variant="outline" className="text-green-500 border-green-500">
            <TrendingUp className="w-4 h-4 mr-2" /> Progress Tracking
          </Badge>
          <div className="flex items-center">
            <Switch
              checked={!isMuted}
              onCheckedChange={() => setIsMuted(!isMuted)}
              className="mr-2"
            />
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}