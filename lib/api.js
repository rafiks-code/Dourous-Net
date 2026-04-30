import supabase from '../supabase.js'

// SIGN UP
export async function signUp(email, password, name, role) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return error
  await supabase.from('profiles').insert({
    id: data.user.id,
    full_name: name,
    email,
    role // 'prof' or 'student'
  })
}

// LOGIN
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  })
  return { data, error }
}

// POST A LESSON (prof only)
export async function postLesson(title, content, profId) {
  const { data, error } = await supabase
    .from('lessons')
    .insert({ title, content, prof_id: profId })
  return { data, error }
}

// GET ALL LESSONS (students)
export async function getLessons() {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
  return { data, error }
}

// ADD GRADE (prof only)
export async function addGrade(studentId, profId, subject, grade, comment) {
  const { data, error } = await supabase
    .from('grades')
    .insert({ student_id: studentId, prof_id: profId, subject, grade, comment })
  return { data, error }
}

// GET MY GRADES (student)
export async function getMyGrades(studentId) {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('student_id', studentId)
  return { data, error }
}

// SEND MESSAGE
export async function sendMessage(senderId, receiverId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
  return { data, error }
}