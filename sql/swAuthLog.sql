USE [swpro]
GO

/****** Object:  Table [dbo].[swAuthLog]    Script Date: 10/16/2024 7:35:41 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[swAuthLog](
	[AuthLogID] [numeric](18, 0) IDENTITY(1,1) NOT NULL,
	[username] [nvarchar](50) NULL,
	[accountstatus] [int] NULL,
	[result] [nvarchar](255) NULL,
	[timestamp] [datetime] NULL,
	[ipaddress] [nvarchar](50) NULL
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[swAuthLog] ADD  CONSTRAINT [DF_swAuthLog_timestamp]  DEFAULT (getdate()) FOR [timestamp]
GO