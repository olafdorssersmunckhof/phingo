export type GameStatus = 'lobby' | 'active' | 'closed'

export interface Game {
  id: string
  code: string
  name: string
  host_token: string
  status: GameStatus
  created_at: string
}

export interface Challenge {
  id: string
  game_id: string
  title: string
  description: string | null
  order: number
  winner_player_id: string | null
  created_at: string
}

export interface Player {
  id: string
  game_id: string
  name: string
  created_at: string
}

export interface Submission {
  id: string
  challenge_id: string
  player_id: string
  photo_url: string
  submitted_at: string
}
