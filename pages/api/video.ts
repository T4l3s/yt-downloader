import fs from "fs"
import { exec } from "child_process"
import path from "path"
import { NextApiRequest, NextApiResponse } from "next"
import ytdl from "ytdl-core"
import { v4 as uuidv4 } from "uuid"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { link, itag, start, end } = req.query
  const PUBLIC_DIR = path.join(process.cwd(), "public", "public_videos")

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT')

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  }

  const deleteFileAfterOneHour = (filePath: string) => {
    setTimeout(() => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`File ${filePath} deleted after one hour.`)
      }
    }, 3600000) // 1 hour in milliseconds
  }

  if (req.method === "GET") {
    if (!link) {
      return res.status(400).json({ message: "Está faltando o link" })
    }

    try {
      const info = await ytdl.getInfo(link as string)
      const thumbnail = info.videoDetails.thumbnails
      const lastIndex = thumbnail.length

      const filterFormatsVideo = info.formats.filter(format => !format.hasAudio)
      const filterFormats = filterFormatsVideo.map(format => ({
        itag: format.itag,
        quality: format.qualityLabel,
        url: format.url,
        videoCodec: format.videoCodec,
        audioCodec: format.audioCodec,
      }))

      return res.status(200).json({
        title: info.videoDetails.title,
        thumbnail: thumbnail[lastIndex === 0 ? 0 : lastIndex - 1].url,
        video_length: parseInt(info.videoDetails.lengthSeconds),
        formats:
          filterFormats.filter(codec => codec.videoCodec === "vp9").length !== 0
            ? filterFormats.filter(codec => codec.videoCodec === "vp9")
            : filterFormats.filter(codec => codec.videoCodec !== "vp9"),
      })
    } catch (err) {
      return res.status(400).json({ message: "O link não é compatível" })
    }
  }

  if (req.method === "POST") {
    if (!link) {
      return res.status(400).json({ message: "Está faltando o link" })
    }

    if (!itag) {
      return res.status(400).json({ message: "Escolha uma resolução" })
    }

    try {
      const info = await ytdl.getInfo(link as string)

      const oldFile = `${uuidv4()}`
      const newFile = `${uuidv4()}`

      const formatMP4 = ytdl.chooseFormat(info.formats, { quality: itag })
      const formatMP3 = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
      })

      const mp4 = path.join(PUBLIC_DIR, `${oldFile}_video.${formatMP4.container}`)
      const mp3 = path.join(PUBLIC_DIR, `${oldFile}_audio.${formatMP3.container}`)

      const outputMP4 = fs.createWriteStream(mp4)
      const outputMP3 = fs.createWriteStream(mp3)

      ytdl.downloadFromInfo(info, { format: formatMP4 }).pipe(outputMP4)
      ytdl.downloadFromInfo(info, { format: formatMP3 }).pipe(outputMP3)

      outputMP4.on("finish", () => {
        exec(
          `ffmpeg -i ${mp4} -i ${mp3} -c:v copy -c:a aac -strict experimental ${path.join(PUBLIC_DIR, `${newFile}.mp4`)}`,
          (err) => {
            if (err) {
              return res.status(400).json({ message: "Erro ao converter arquivo" })
            }

            fs.unlinkSync(mp4)
            fs.unlinkSync(mp3)

            const finalFilePath = path.join(PUBLIC_DIR, `${newFile}.mp4`)
            deleteFileAfterOneHour(finalFilePath)

            return res.status(200).json({
              message: "Download finalizado",
              downloadFile: `/public_videos/${newFile}.mp4`,
            })
          },
        )
      })
    } catch (err) {
      return res.status(400).json({ message: "O link não é compatível" })
    }
  }

  if (req.method === "PUT") {
    if (!link) {
      return res.status(400).json({ message: "Está faltando o link" })
    }

    if (!itag) {
      return res.status(400).json({ message: "Está faltando o itag para baixar o vídeo" })
    }

    if (!start || !end) {
      return res.status(400).json({ message: "Tempo não determinados da forma correta" })
    }

    try {
      const info = await ytdl.getInfo(link as string)

      const oldFile = `${uuidv4()}`
      const newFile = `${uuidv4()}`

      const formatMP4 = ytdl.chooseFormat(info.formats, { quality: itag })
      const formatMP3 = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
      })

      const mp4 = path.join(PUBLIC_DIR, `${oldFile}_video.${formatMP4.container}`)
      const mp3 = path.join(PUBLIC_DIR, `${oldFile}_audio.${formatMP3.container}`)

      const outputMP4 = fs.createWriteStream(mp4)
      const outputMP3 = fs.createWriteStream(mp3)

      ytdl.downloadFromInfo(info, { format: formatMP4 }).pipe(outputMP4)
      ytdl.downloadFromInfo(info, { format: formatMP3 }).pipe(outputMP3)

      outputMP4.on("finish", () => {
        exec(
          `ffmpeg -i ${mp4} -i ${mp3} -c:v copy -c:a aac -strict experimental ${path.join(PUBLIC_DIR, `${newFile}_convert.mp4`)}`,
          (err) => {
            if (err) {
              return res.status(400).json({ message: "Erro ao converter arquivo" })
            }

            exec(
              `ffmpeg -ss ${start} -to ${end} -i ${path.join(PUBLIC_DIR, `${newFile}_convert.mp4`)} -c copy ${path.join(PUBLIC_DIR, `${newFile}.mp4`)}`,
              (err) => {
                if (err) {
                  return res.status(400).json({ message: "Erro ao converter arquivo" })
                }

                fs.unlinkSync(mp4)
                fs.unlinkSync(mp3)
                fs.unlinkSync(path.join(PUBLIC_DIR, `${newFile}_convert.mp4`))

                const finalFilePath = path.join(PUBLIC_DIR, `${newFile}.mp4`)
                deleteFileAfterOneHour(finalFilePath)

                return res.status(200).json({
                  message: "Download finalizado",
                  downloadFile: `/public_videos/${newFile}.mp4`,
                })
              },
            )
          },
        )
      })
    } catch (err) {
      return res.status(400).json({ message: "O link não é compatível" })
    }
  }
}