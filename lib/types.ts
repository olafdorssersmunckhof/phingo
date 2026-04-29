export type GameStatus = 'lobby' | 'active' | 'closed'

export interface Host {
  id: string
  username: string
  created_at: string
}

export interface Game {
  id: string
  code: string
  name: string
  host_id: string
  status: GameStatus
  created_at: string
}

export interface Team {
  id: string
  game_id: string
  name: string
  join_code: string
  created_at: string
}

export interface Challenge {
  id: string
  game_id: string
  title: string
  description: string | null
  order: number
  winner_team_id: string | null
  created_at: string
}

export interface Submission {
  id: string
  challenge_id: string
  team_id: string
  photo_url: string
  submitted_at: string
}
