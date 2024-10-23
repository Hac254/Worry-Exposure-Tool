'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  anxietyRatings: number[]
  answers: string[]
  reflections: { text: string; rating: number }[]
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
  const [stage, setStage] = useState<'splash' | 'input' | 'exposure' | 'reflection' | 'dashboard'>('splash')
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [anxietyRatings, setAnxietyRatings] = useState<number[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [reflections, setReflections] = useState<{ text: string; rating: number }[]>([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showExamples, setShowExamples] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('worryExposureUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    // Initialize audio
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
    if (stage === 'exposure' && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1)
        setProgress(prev => prev + (100 / (duration * 60)))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [stage, timeRemaining, duration])

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
    setTimeRemaining(duration * 60)
    setStage('exposure')
    // Start playing audio when session begins
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(error => console.log("Audio play failed:", error))
    }
  }

  const handleAnxietyRating = (rating: number) => {
    const newRatings = [...anxietyRatings]
    newRatings[currentPrompt] = rating
    setAnxietyRatings(newRatings)
  }

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentPrompt] = answer
    setAnswers(newAnswers)
  }

  const handleNextPrompt = () => {
    if (currentPrompt < aiPrompts.length - 1) {
      setCurrentPrompt(prev => prev + 1)
    } else {
      setStage('reflection')
      setCurrentPrompt(0)
    }
  }

  const handlePreviousPrompt = () => {
    if (currentPrompt > 0) {
      setCurrentPrompt(prev => prev - 1)
    } else if (stage === 'reflection') {
      setStage('exposure')
      setCurrentPrompt(aiPrompts.length - 1)
    } else {
      setStage('input')
    }
  }

  const handleReflectionSubmit = (reflection: string, rating: number) => {
    const newReflections = [...reflections]
    newReflections[currentPrompt] = { text: reflection, rating }
    setReflections(newReflections)
    if (currentPrompt < reflectionQuestions.length - 1) {
      setCurrentPrompt(prev => prev + 1)
    } else {
      saveSession()
    }
  }

  const saveSession = () => {
    const newSession: Session = {
      worry,
      duration,
      anxietyRatings,
      answers,
      reflections,
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
    // Stop audio when session ends
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
    setAnxietyRatings([])
    setAnswers([])
    setReflections([])
    setTimeRemaining(0)
    setProgress(0)
    // Stop audio when resetting the tool
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
                <Button 
                  onClick={handleStartExposure} 
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                  disabled={!worry || !duration}
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
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-4">
                  <Progress value={progress} className="w-full" />
                  <p className="text-center mt-2">
                    Time remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </p>
                </div>
                <Card className="mb-4 bg-white dark:bg-gray-800">
                  <CardContent className="p-4">
                    <p className="text-lg mb-4">{aiPrompts[currentPrompt]}</p>
                    <Textarea
                      value={answers[currentPrompt] || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full mb-4"
                    />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Rate your anxiety:
                    </label>
                    <div className="flex items-center space-x-2 mb-4">
                
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Button
                          key={value}
                          variant={anxietyRatings[currentPrompt] === value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAnxietyRating(value)}
                          className={`w-10 h-10 rounded-full p-0 ${anxietyRatings[currentPrompt] === value ? 'bg-orange-500 text-white' : 'border-black'}`}
                        >
                          {value}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {anxietyRatings[currentPrompt] ? `You rated: ${anxietyRatings[currentPrompt]}/5` : 'Not rated yet'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between">
                  <Button onClick={handlePreviousPrompt} className="bg-gray-500 hover:bg-gray-600 text-white">
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button 
                    onClick={handleNextPrompt} 
                    className="bg-pink-500 hover:bg-pink-600 text-white" 
                    disabled={!anxietyRatings[currentPrompt] || !answers[currentPrompt]}
                  >
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
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
                      value={reflections[currentPrompt]?.text || ''}
                      onChange={(e) => {
                        const newReflections = [...reflections]
                        newReflections[currentPrompt] = { ...newReflections[currentPrompt], text: e.target.value }
                        setReflections(newReflections)
                      }}
                      placeholder="Your thoughts..."
                      className="w-full mb-4"
                    />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Rate how helpful this reflection was:
                    </label>
                    <div className="flex items-center space-x-2 mb-4">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Button
                          key={value}
                          variant={reflections[currentPrompt]?.rating === value ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const newReflections = [...reflections]
                            newReflections[currentPrompt] = { ...newReflections[currentPrompt], rating: value }
                            setReflections(newReflections)
                          }}
                          className={`w-10 h-10 rounded-full p-0 ${reflections[currentPrompt]?.rating === value ? 'bg-orange-500 text-white' : 'border-black'}`}
                        >
                          {value}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between">
                  <Button onClick={handlePreviousPrompt} className="bg-gray-500 hover:bg-gray-600 text-white">
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button 
                    onClick={() => handleReflectionSubmit(reflections[currentPrompt]?.text || '', reflections[currentPrompt]?.rating || 0)} 
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                    disabled={!reflections[currentPrompt]?.text || !reflections[currentPrompt]?.rating}
                  >
                    {currentPrompt < reflectionQuestions.length - 1 ? 'Next Question' : 'Complete Reflection'}
                  </Button>
                </div>
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
                      <Clock className="w-4 h-4 mr-2" /> Total Time: {user.sessions.reduce((acc, session) => acc + session.duration, 0)} minutes
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
                        const avgAnxiety = session.anxietyRatings.reduce((a, b) => a + b, 0) / session.anxietyRatings.length
                        return (
                          <div
                            key={index}
                            className="bg-blue-500 w-1/5"
                            style={{ height: `${avgAnxiety * 20}%` }}
                            title={`Session ${index + 1}: ${avgAnxiety.toFixed(1)}`}
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