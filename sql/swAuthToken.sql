USE [swpro]
GO

/****** Object:  Table [dbo].[swAuthTokens]    Script Date: 10/16/2024 7:34:54 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[swAuthTokens](
	[id] [numeric](18, 0) IDENTITY(1,1) NOT NULL,
	[value] [nvarchar](256) NOT NULL,
	[user] [uniqueidentifier] NULL,
	[created] [datetime2](7) NULL,
	[expires] [numeric](18, 0) NOT NULL,
	[expiresAt] [datetime] NULL
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[swAuthTokens] ADD  CONSTRAINT [DF_swAuthTokens_created]  DEFAULT (getdate()) FOR [created]
GO

ALTER TABLE [dbo].[swAuthTokens] ADD  CONSTRAINT [DF_swAuthTokens_expires]  DEFAULT ((0)) FOR [expires]
GO
